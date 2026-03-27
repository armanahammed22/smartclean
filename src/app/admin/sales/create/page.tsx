
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';

function CreateSalesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const db = useFirestore();
    const { toast } = useToast();
    const modeParam = searchParams.get('mode') || 'order';

    const [currentMode, setCurrentMode] = useState<'order' | 'booking'>(modeParam as any);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [bookingDetails, setBookingDetails] = useState({ date: '', time: '', duration: '' });
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');

    const productsRef = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
    const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

    const { data: products } = useCollection(productsRef);
    const { data: services } = useCollection(servicesRef);

    useEffect(() => {
        if (modeParam === 'order' || modeParam === 'booking') {
            setCurrentMode(modeParam as any);
            setSelectedItems([]);
        }
    }, [modeParam]);

    const allItems = useMemo(() => {
        const prodList = products?.map(p => ({ id: p.id, name: p.name, type: 'product', price: p.price, category: p.categoryId })) || [];
        const servList = services?.map(s => ({ id: s.id, name: s.title, type: 'service', price: s.basePrice, category: s.categoryId })) || [];
        return [...prodList, ...servList];
    }, [products, services]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return allItems.filter(item => 
            (item.type === currentMode) && 
            (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery, allItems, currentMode]);

    const calculateTotals = () => {
        const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const serviceCharge = currentMode === 'order' ? 80 : 0;
        const total = subtotal + serviceCharge - discount;
        return { subtotal, serviceCharge, total };
    };

    const { subtotal, serviceCharge, total } = calculateTotals();

    const addItem = (item: any) => {
        const existing = selectedItems.find(i => i.id === item.id);
        if (existing) {
            setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
        }
        setSearchQuery('');
        setShowResults(false);
    };

    const removeItem = (id: string) => setSelectedItems(selectedItems.filter(i => i.id !== id));
    
    const updateQuantity = (id: string, delta: number) => {
        setSelectedItems(selectedItems.map(i => {
            if (i.id === id) {
                const q = Math.max(1, i.quantity + delta);
                return { ...i, quantity: q };
            }
            return i;
        }));
    };

    const handleSubmit = async () => {
        if (!db) return;
        if (selectedItems.length === 0) return alert('আইটেম যোগ করুন!');
        if (!customer.name || !customer.phone || !customer.address) return alert('প্রয়োজনীয় তথ্য দিন!');

        setIsLoading(true);
        try {
            const data = {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                address: customer.address,
                items: selectedItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, itemType: i.type })),
                subtotal,
                discount,
                totalPrice: total,
                paymentMethod,
                notes,
                status: 'New',
                createdAt: new Date().toISOString()
            };

            if (currentMode === 'booking') {
                Object.assign(data, {
                    dateTime: bookingDetails.date + ' ' + bookingDetails.time,
                    duration: bookingDetails.duration,
                    serviceTitle: selectedItems[0]?.name
                });
            }

            const coll = currentMode === 'order' ? 'orders' : 'bookings';
            const docRef = await addDoc(collection(db, coll), data);
            
            // Auto-generate Invoice
            await getOrCreateInvoice(db, docRef.id, currentMode === 'order' ? 'order' : 'booking', data);

            toast({ title: "Success", description: currentMode === 'order' ? "অর্ডার তৈরি হয়েছে!" : "বুকিং তৈরি হয়েছে!" });
            router.push(currentMode === 'order' ? '/admin/orders' : '/admin/bookings');
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save." });
        } finally {
            setIsLoading(false);
        }
    };

    const convertToBengaliNumber = (num: number) => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().split('').map(digit => bengaliDigits[parseInt(digit)] || digit).join('');
    };

    return (
        <div className="dashboard-container">
            <style dangerouslySetInnerHTML={{ __html: `
                .search-results.active { display: block; }
                .booking-fields.active { display: block; }
                .loading { pointer-events: none; opacity: 0.7; }
                .loading::after { content: ''; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 10px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}} />
            
            <div className="dashboard-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => router.back()}>←</button>
                    <h1>ম্যানুয়াল {currentMode === 'order' ? 'অর্ডার' : 'বুকিং'} তৈরি করুন</h1>
                </div>
                <div className="header-badge">⚡ Admin Panel</div>
            </div>

            <div className="tab-container">
                <button className={cn("tab-button", currentMode === 'order' && "active")} onClick={() => router.push('/admin/sales/create?mode=order')}>
                    <span className="tab-icon">🛒</span>
                    <span>অর্ডার</span>
                </button>
                <button className={cn("tab-button booking-tab", currentMode === 'booking' && "active")} onClick={() => router.push('/admin/sales/create?mode=booking')}>
                    <span className="tab-icon">📅</span>
                    <span>বুকিং</span>
                </button>
            </div>

            <div className="main-grid">
                <div className="left-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">{currentMode === 'order' ? '🛍️' : '📅'}</div>
                            <h2 className="card-title">{currentMode === 'order' ? 'পণ্য যোগ করুন' : 'সেবা যোগ করুন'}</h2>
                        </div>

                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <span className="search-icon">🔍</span>
                                <input 
                                    type="text" 
                                    class="search-input" 
                                    placeholder={`${currentMode === 'order' ? 'পণ্য' : 'সেবা'} খুঁজুন...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowResults(true)}
                                />
                            </div>
                            <div className={cn("search-results", showResults && searchQuery && "active")}>
                                {filteredItems.map(item => (
                                    <div key={item.id} className="search-result-item" onClick={() => addItem(item)}>
                                        <div className="result-info">
                                            <div className="result-name">
                                                {item.name}
                                                <span className={cn("result-tag", item.type)}>{item.type === 'product' ? 'পণ্য' : 'সেবা'}</span>
                                            </div>
                                            <div className="result-meta">{item.category}</div>
                                        </div>
                                        <div className="result-price">৳ {item.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="selected-items">
                            <div className="items-header">
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>নির্বাচিত আইটেম</h3>
                                <span className="items-count">{convertToBengaliNumber(selectedItems.length)}</span>
                            </div>

                            <div id="selectedItemsList">
                                {selectedItems.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <div className="empty-text">এখনও কোনো আইটেম যোগ করা হয়নি</div>
                                    </div>
                                ) : (
                                    selectedItems.map(item => (
                                        <div key={item.id} className="item-card">
                                            <div className="item-header">
                                                <div className="item-name">{item.name}</div>
                                                <button className="remove-item" onClick={() => removeItem(item.id)}>×</button>
                                            </div>
                                            <div className="item-controls">
                                                <div className="quantity-control">
                                                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                    <span className="quantity-value">{convertToBengaliNumber(item.quantity)}</span>
                                                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                                </div>
                                                <div className="item-total">
                                                    <div className="item-total-label">মোট</div>
                                                    <div className="item-total-value">৳ {(item.price * item.quantity).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">👤</div>
                            <h2 className="card-title">গ্রাহকের তথ্য</h2>
                        </div>
                        <div className="form-group">
                            <label>গ্রাহকের নাম *</label>
                            <input type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="যেমন: রহিম উদ্দিন" required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>মোবাইল নম্বর *</label>
                                <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" required />
                            </div>
                            <div className="form-group">
                                <label>ইমেইল <span className="label-optional">(ঐচ্ছিক)</span></label>
                                <input type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} placeholder="example@email.com" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>ঠিকানা *</label>
                            <textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="বাড়ি নং, রোড, এলাকা, শহর" required></textarea>
                        </div>

                        {currentMode === 'booking' && (
                            <div className="booking-fields active">
                                <div className="form-row datetime-row">
                                    <div className="form-group">
                                        <label>বুকিং তারিখ *</label>
                                        <input type="date" value={bookingDetails.date} onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>সময় *</label>
                                        <input type="time" value={bookingDetails.time} onChange={e => setBookingDetails({...bookingDetails, time: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>সেবার সময়কাল</label>
                                    <select value={bookingDetails.duration} onChange={e => setBookingDetails({...bookingDetails, duration: e.target.value})}>
                                        <option value="">নির্বাচন করুন</option>
                                        <option value="30">৩০ মিনিট</option>
                                        <option value="60">১ ঘন্টা</option>
                                        <option value="120">২ ঘন্টা</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="right-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">💰</div>
                            <h2 className="card-title">সারসংক্ষেপ</h2>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">সাবটোটাল</span>
                            <span className="summary-value">৳ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{currentMode === 'order' ? 'ডেলিভারি চার্জ' : 'সার্ভিস চার্জ'}</span>
                            <span className="summary-value">৳ {serviceCharge}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">ছাড়</span>
                            <div style={{ maxWidth: '150px' }}>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ padding: '0.5rem', textAlign: 'right' }} />
                            </div>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">মোট পরিমাণ</span>
                            <span className="summary-value">৳ {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">💳</div>
                            <h2 className="card-title">পেমেন্ট পদ্ধতি</h2>
                        </div>
                        <div className="payment-grid">
                            {[
                                { id: 'cod', label: 'ক্যাশ অন ডেলিভারি', icon: '📦' },
                                { id: 'bkash', label: 'বিকাশ', icon: '💸' },
                                { id: 'nagad', label: 'নগদ', icon: '💰' },
                                { id: 'bank', label: 'ব্যাংক ট্রান্সফার', icon: '🏦' }
                            ].map(method => (
                                <div key={method.id} className="payment-option">
                                    <input type="radio" id={method.id} name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                                    <label htmlFor={method.id}>
                                        <div className="payment-icon">{method.icon}</div>
                                        <div className="payment-name">{method.label}</div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">📝</div>
                            <h2 className="card-title">অতিরিক্ত নোট</h2>
                        </div>
                        <div className="form-group">
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="কোনো বিশেষ নির্দেশনা বা মন্তব্য"></textarea>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="btn btn-secondary">💾 খসড়া সংরক্ষণ</button>
                        <button className={cn("btn btn-primary", currentMode === 'booking' && "booking-mode", isLoading && "loading")} onClick={handleSubmit}>
                            {currentMode === 'order' ? '✅ অর্ডার নিশ্চিত করুন' : '✅ বুকিং নিশ্চিত করুন'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesCreatePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>}>
            <CreateSalesContent />
        </Suspense>
    );
}
