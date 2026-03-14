
"use client";

import Link from 'next/link';
import { ShoppingCart, Package, Search, Gift, Zap, User, Menu } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  "Desktop", "Laptop", "Component", "Monitor", "Power", "Phone", "Tablet", 
  "Office Equipment", "Camera", "Security", "Networking", "Software", 
  "Server & Storage", "Accessories", "Gadget", "Gaming", "TV", "Appliance"
];

export function Navbar() {
  const { itemCount } = useCart();

  return (
    <header className="w-full z-50">
      {/* Top Bar */}
      <div className="bg-[#081621] text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
              <Package size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tighter font-headline text-white">QUICKTECH</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <Input 
              placeholder="Search products..." 
              className="w-full bg-white text-black h-11 pr-12 rounded-sm focus-visible:ring-0 border-none"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-primary" size={20} />
          </div>

          {/* Action Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/offers" className="flex items-center gap-3 hover:text-primary transition-colors">
              <Gift className="text-primary" size={24} />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">Offers</span>
                <span className="text-[10px] text-gray-400">Latest Offers</span>
              </div>
            </Link>
            <Link href="/deals" className="flex items-center gap-3 hover:text-primary transition-colors">
              <Zap className="text-primary" size={24} />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">Special Deals</span>
                <span className="text-[10px] text-gray-400">Flash Sales</span>
              </div>
            </Link>
            <Link href="/account" className="flex items-center gap-3 hover:text-primary transition-colors">
              <User className="text-primary" size={24} />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">Account</span>
                <span className="text-[10px] text-gray-400">Register or Login</span>
              </div>
            </Link>
            <Button className="bg-primary hover:bg-primary/90 font-bold px-6 h-11 rounded-sm">
              PC Builder
            </Button>
          </div>
          
          {/* Mobile Cart/Menu */}
          <div className="flex lg:hidden items-center gap-4">
             <Button variant="ghost" size="icon" asChild className="relative text-white">
              <Link href="/cart">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary">
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Menu className="cursor-pointer" size={28} />
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b shadow-sm hidden lg:block">
        <div className="container mx-auto px-4 overflow-x-auto">
          <nav className="flex items-center justify-between py-3">
            {CATEGORIES.slice(0, 12).map((cat) => (
              <Link 
                key={cat} 
                href={`/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-[13px] font-semibold hover:text-primary whitespace-nowrap px-1 transition-colors"
              >
                {cat}
              </Link>
            ))}
            <Link href="/cart" className="relative ml-4 flex items-center gap-2 group">
              <ShoppingCart size={20} className="group-hover:text-primary transition-colors" />
              <span className="text-[13px] font-semibold group-hover:text-primary transition-colors">Cart</span>
              {itemCount > 0 && (
                <Badge className="absolute -top-3 -right-3 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-white">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
