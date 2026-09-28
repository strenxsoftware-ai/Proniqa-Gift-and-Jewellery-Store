import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Check, Heart, Loader2, LockKeyhole, Mail, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Upload, UserRound, X } from 'lucide-react';
import {
  isFirebaseConfigured,
  placeOrder,
  registerCustomer,
  signInCustomer,
  signOutCustomer,
  submitFrameEnquiry,
  subscribeToAuth,
  subscribeToProducts,
  type StoreProduct,
} from '@/lib/firebase';

const queryClient = new QueryClient();

type Product = StoreProduct;

const fallbackProducts: Product[] = [
  { id: 'p1', name: 'The Almost Everyday Hoops', price: '₹1,290', category: 'Jewellery', image: '/images/earrings-close.jpg', tone: 'terracotta', badge: 'Bestseller' },
  { id: 'p2', name: 'A Little Love Frame', price: '₹1,890', category: 'Personalised', image: '/images/frame-custom.jpg', tone: 'blush', badge: 'Made for you' },
  { id: 'p3', name: 'The Soft Spot Gift Box', price: '₹2,450', category: 'Gifting', image: '/images/gifting-set.jpg', tone: 'coral', badge: 'Ready to gift' },
  { id: 'p4', name: 'Tiny Sun Studs', price: '₹890', category: 'Jewellery', image: '/images/earrings-close.jpg', tone: 'mustard' },
  { id: 'p5', name: 'Our Place, Framed', price: '₹2,190', category: 'Personalised', image: '/images/frame-custom.jpg', tone: 'peach' },
  { id: 'p6', name: 'The Thank You Edit', price: '₹1,650', category: 'Gifting', image: '/images/gifting-set.jpg', tone: 'wine' },
];

const categories = ['All pieces', 'Jewellery', 'Personalised', 'Gifting'];

function AppButton({ children, onClick, variant = 'dark', testId, className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'dark' | 'light' | 'outline'; testId: string; className?: string }) {
  const styles = variant === 'dark' ? 'bg-[#5c2e30] text-[#fff8ed] hover:bg-[#74393a]' : variant === 'light' ? 'bg-[#fff8ed] text-[#5c2e30] hover:bg-white' : 'border border-[#5c2e30]/35 text-[#5c2e30] hover:bg-[#f5dfc8]';
  return <button data-testid={testId} onClick={onClick} className={`inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${styles} ${className}`}>{children}</button>;
}

function Header({ onCart, cartCount, onSearch, onMenu, onAccount, userEmail }: { onCart: () => void; cartCount: number; onSearch: () => void; onMenu: () => void; onAccount: () => void; userEmail?: string }) {
  return (
    <>
      <div className="bg-[#d96d4d] px-4 py-2 text-center text-[11px] font-semibold tracking-[.12em] text-[#fff8ed]">FREE SHIPPING ON ORDERS OVER ₹1,499 <span className="mx-2 opacity-60">·</span> MADE TO BE KEPT</div>
      <header className="sticky top-0 z-30 border-b border-[#5c2e30]/10 bg-[#f8f0e2]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-6">
            <button className="lg:hidden" onClick={onMenu} data-testid="button-open-menu" aria-label="Open menu"><Menu size={22} /></button>
            <a href="#top" className="serif text-[30px] font-semibold tracking-[-.06em] text-[#5c2e30]" data-testid="link-home">proniqa<span className="text-[#d96d4d]">.</span></a>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            <a className="line-link text-sm text-[#5c2e30]" href="#shop" data-testid="link-shop">Shop all</a>
            <a className="line-link text-sm text-[#5c2e30]" href="#new" data-testid="link-new">New in</a>
            <a className="line-link text-sm text-[#5c2e30]" href="#personalise" data-testid="link-personalised">Personalised</a>
            <a className="line-link text-sm text-[#5c2e30]" href="#story" data-testid="link-story">Our story</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onSearch} className="text-[#5c2e30] transition-transform hover:scale-110" data-testid="button-search" aria-label="Search products"><Search size={20} strokeWidth={1.7} /></button>
            <button onClick={onAccount} className="hidden text-[#5c2e30] transition-transform hover:scale-110 sm:block" data-testid="button-account" aria-label={userEmail ? 'Open account' : 'Sign in'}><UserRound size={20} strokeWidth={1.7} /></button>
            <button onClick={onCart} className="relative text-[#5c2e30] transition-transform hover:scale-110" data-testid="button-cart" aria-label="Open cart"><ShoppingBag size={21} strokeWidth={1.7} />{cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d96d4d] px-1 text-[9px] font-bold text-[#fff8ed]">{cartCount}</span>}</button>
          </div>
        </div>
      </header>
    </>
  );
}

function ProductCard({ product, wished, onWish, onAdd }: { product: Product; wished: boolean; onWish: () => void; onAdd: () => void }) {
  return (
    <article className="group min-w-[240px] flex-1" data-testid={`card-product-${product.id}`}>
      <div className={`relative aspect-[.83] overflow-hidden rounded-[1.4rem] bg-[#ead8c4] ${product.tone === 'terracotta' ? 'bg-[#e8c7b3]' : product.tone === 'blush' ? 'bg-[#e8cfd0]' : product.tone === 'coral' ? 'bg-[#e8bba9]' : 'bg-[#ead8c4]'}`}>
        <img src={product.image} alt={product.name} className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" data-testid={`img-product-${product.id}`} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#fff8ed]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#5c2e30]">{product.badge}</span>}
        <button onClick={onWish} className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8ed]/90 transition-all hover:scale-110 ${wished ? 'text-[#d96d4d]' : 'text-[#5c2e30]'}`} data-testid={`button-wishlist-${product.id}`} aria-label={`Wishlist ${product.name}`}><Heart size={16} fill={wished ? 'currentColor' : 'none'} /></button>
        <button onClick={onAdd} className="absolute bottom-4 left-4 right-4 translate-y-3 rounded-full bg-[#fff8ed] py-3 text-xs font-bold text-[#5c2e30] opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" data-testid={`button-add-${product.id}`}>Add to bag</button>
      </div>
      <div className="flex items-start justify-between gap-3 px-1 pt-4">
        <div><h3 className="serif text-[17px] leading-tight text-[#5c2e30]" data-testid={`text-product-${product.id}`}>{product.name}</h3><p className="mt-1 text-xs text-[#7c6260]">{product.category}</p></div>
        <span className="whitespace-nowrap text-sm font-semibold text-[#5c2e30]" data-testid={`text-price-${product.id}`}>{product.price}</span>
      </div>
    </article>
  );
}

function CartDrawer({ open, onClose, cart, onRemove, onAdd, onCheckout }: { open: boolean; onClose: () => void; cart: Product[]; onRemove: (id: string) => void; onAdd: (product: Product) => void; onCheckout: () => void }) {
  const subtotal = cart.reduce((total, item) => total + Number(item.price.replace(/[₹,]/g, '')), 0);
  return <div className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    <div onClick={onClose} className={`absolute inset-0 bg-[#3e2025]/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
    <aside className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-[#fff8ed] shadow-2xl transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Shopping bag">
      <div className="flex items-center justify-between border-b border-[#5c2e30]/10 px-6 py-5"><div><p className="mono text-[#d96d4d]">Your little bag</p><h2 className="serif mt-1 text-3xl text-[#5c2e30]">A good choice.</h2></div><button onClick={onClose} data-testid="button-close-cart"><X /></button></div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-5 rounded-full bg-[#f3ddc8] p-5 text-[#d96d4d]"><ShoppingBag size={28} /></div><h3 className="serif text-2xl text-[#5c2e30]">Your bag is waiting.</h3><p className="mt-2 max-w-[230px] text-sm leading-relaxed text-[#7c6260]">For something small, personal and very lovely.</p></div> : <div className="space-y-5">{cart.map((item, index) => <div className="flex gap-4" key={`${item.id}-${index}`} data-testid={`row-cart-${item.id}-${index}`}><img src={item.image} alt="" className="h-24 w-20 rounded-xl object-cover mix-blend-multiply" /><div className="flex flex-1 justify-between"><div><h4 className="serif text-lg text-[#5c2e30]">{item.name}</h4><p className="mt-1 text-sm text-[#7c6260]">{item.price}</p><div className="mt-3 flex items-center gap-3"><button onClick={() => onRemove(item.id)} className="rounded-full border border-[#5c2e30]/20 p-1" data-testid={`button-remove-${item.id}`}><Minus size={12} /></button><span className="text-xs">1</span><button onClick={() => onAdd(item)} className="rounded-full border border-[#5c2e30]/20 p-1" data-testid={`button-increase-${item.id}`}><Plus size={12} /></button></div></div><button onClick={() => onRemove(item.id)} className="self-start text-[#7c6260]" data-testid={`button-delete-${item.id}`}><X size={15} /></button></div></div>)}</div>}</div>
      {cart.length > 0 && <div className="border-t border-[#5c2e30]/10 px-6 py-6"><div className="mb-4 flex justify-between text-sm"><span>Subtotal</span><strong data-testid="text-cart-subtotal">₹{subtotal.toLocaleString('en-IN')}</strong></div><AppButton testId="button-checkout" onClick={onCheckout} className="w-full">Save order request <ArrowRight size={15} /></AppButton><p className="mt-3 text-center text-[11px] text-[#7c6260]">We will confirm payment and delivery by email</p></div>}
    </aside>
  </div>;
}

function ModalShell({ children, onClose, title, eyebrow }: { children: ReactNode; onClose: () => void; title: string; eyebrow: string }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button className="absolute inset-0 bg-[#3e2025]/45" onClick={onClose} aria-label="Close dialog" />
    <div className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[1.6rem] bg-[#fff8ed] p-6 shadow-2xl sm:p-8">
      <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-[#7c6260] transition hover:bg-[#f2dec8]" data-testid="button-close-modal" aria-label="Close dialog"><X size={18} /></button>
      <p className="mono text-[#d96d4d]">{eyebrow}</p>
      <h2 className="serif mt-2 pr-8 text-4xl leading-none text-[#5c2e30]">{title}</h2>
      {children}
    </div>
  </div>;
}

function AuthModal({ open, onClose, userEmail, onNotice }: { open: boolean; onClose: () => void; userEmail?: string; onNotice: (message: string) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') await signInCustomer(email, password);
      else await registerCustomer(email, password);
      onNotice(mode === 'signin' ? 'Welcome back to Proniqa.' : 'Your Proniqa account is ready.');
      onClose();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message.replace('Firebase: ', '') : 'We could not complete that request.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutCustomer();
      onNotice('You have been signed out.');
      onClose();
    } catch {
      setError('We could not sign you out right now.');
    }
  };

  return <ModalShell onClose={onClose} eyebrow="Your Proniqa account" title={userEmail ? 'Good to see you.' : mode === 'signin' ? 'Welcome back.' : 'Make it yours.'}>
    {userEmail ? <div className="mt-6">
      <div className="flex items-center gap-3 rounded-2xl bg-[#f2dec8] p-4 text-[#5c2e30]"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d96d4d] text-[#fff8ed]"><UserRound size={18} /></div><div><p className="text-xs uppercase tracking-[.12em] text-[#7c6260]">Signed in as</p><p className="mt-1 text-sm font-semibold">{userEmail}</p></div></div>
      <button onClick={handleSignOut} className="mt-5 w-full rounded-full border border-[#5c2e30]/25 px-5 py-3 text-sm font-semibold text-[#5c2e30] transition hover:bg-[#f2dec8]" data-testid="button-sign-out">Sign out</button>
    </div> : <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <p className="text-sm leading-6 text-[#765d5c]">Save your favourite finds and keep your frame enquiries together.</p>
      <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Email</span><div className="flex items-center gap-3 rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4"><Mail size={16} className="text-[#d96d4d]" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#5c2e30] outline-none" placeholder="you@example.com" data-testid="input-auth-email" /></div></label>
      <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Password</span><div className="flex items-center gap-3 rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4"><LockKeyhole size={16} className="text-[#d96d4d]" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#5c2e30] outline-none" placeholder="At least 6 characters" data-testid="input-auth-password" /></div></label>
      {error && <p className="rounded-xl bg-[#f7d8d2] px-4 py-3 text-sm text-[#8a3030]" role="alert">{error}</p>}
      <button disabled={busy || !isFirebaseConfigured} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5c2e30] px-5 py-3 text-sm font-semibold text-[#fff8ed] transition hover:bg-[#74393a] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-auth-submit">{busy && <Loader2 size={16} className="animate-spin" />}{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="w-full text-center text-sm text-[#5c2e30] underline underline-offset-4" data-testid="button-toggle-auth">{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
    </form>}
  </ModalShell>;
}

function FrameEnquiryModal({ open, onClose, userId, defaultEmail, onDone }: { open: boolean; onClose: () => void; userId?: string; defaultEmail?: string; onDone: (message: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (defaultEmail) setEmail(defaultEmail); }, [defaultEmail]);
  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await submitFrameEnquiry({ name, email, note, file, userId });
      onDone('Your frame request is saved. We will be in touch soon.');
      setName('');
      setNote('');
      setFile(undefined);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message.replace('Firebase: ', '') : 'We could not save your frame request.');
    } finally {
      setBusy(false);
    }
  };

  return <ModalShell onClose={onClose} eyebrow="Your story, framed" title="Let’s make it personal.">
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <p className="text-sm leading-6 text-[#765d5c]">Share a little about the memory and upload the photo you want to turn into a keepsake.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Your name</span><input required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4 py-3 text-sm outline-none" placeholder="Your name" data-testid="input-frame-name" /></label>
        <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4 py-3 text-sm outline-none" placeholder="you@example.com" data-testid="input-frame-email" /></label>
      </div>
      <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Your idea</span><textarea required value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full resize-y rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4 py-3 text-sm outline-none" placeholder="Tell us the date, words, or feeling you want to keep." data-testid="input-frame-note" /></label>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#5c2e30]/25 bg-[#f8f0e2] px-4 py-4 transition hover:bg-[#f2dec8]"><Upload size={18} className="text-[#d96d4d]" /><span className="min-w-0 flex-1 text-sm text-[#5c2e30]">{file ? file.name : 'Upload your photo (optional)'}</span><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} className="sr-only" data-testid="input-frame-photo" /></label>
      {error && <p className="rounded-xl bg-[#f7d8d2] px-4 py-3 text-sm text-[#8a3030]" role="alert">{error}</p>}
      <button disabled={busy || !isFirebaseConfigured} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5c2e30] px-5 py-3 text-sm font-semibold text-[#fff8ed] transition hover:bg-[#74393a] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-submit-frame">{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Send my frame idea</button>
    </form>
  </ModalShell>;
}

function CheckoutModal({ open, onClose, cart, userId, defaultEmail, onComplete, onDone }: { open: boolean; onClose: () => void; cart: Product[]; userId?: string; defaultEmail?: string; onComplete: () => void; onDone: (message: string) => void }) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (defaultEmail) setEmail(defaultEmail); }, [defaultEmail]);
  if (!open) return null;

  const total = cart.reduce((sum, item) => sum + Number(item.price.replace(/[₹,]/g, '')), 0);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await placeOrder({ items: cart.map(({ id, name, price }) => ({ id, name, price })), total, customerEmail: email, userId });
      onComplete();
      onDone('Your order request is saved. We will confirm it by email.');
      onClose();
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message.replace('Firebase: ', '') : 'We could not save your order right now.');
    } finally {
      setBusy(false);
    }
  };

  return <ModalShell onClose={onClose} eyebrow="Your little bag" title="Ready when you are.">
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <p className="text-sm leading-6 text-[#765d5c]">This saves your order request in Proniqa so you can follow up with the customer. Payment can be added next.</p>
      <div className="rounded-2xl bg-[#f2dec8] p-4"><div className="flex justify-between text-sm text-[#765d5c]"><span>{cart.length} {cart.length === 1 ? 'piece' : 'pieces'}</span><strong className="text-[#5c2e30]">₹{total.toLocaleString('en-IN')}</strong></div></div>
      <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-[#7c6260]">Customer email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#5c2e30]/15 bg-[#f8f0e2] px-4 py-3 text-sm outline-none" placeholder="customer@example.com" data-testid="input-order-email" /></label>
      {error && <p className="rounded-xl bg-[#f7d8d2] px-4 py-3 text-sm text-[#8a3030]" role="alert">{error}</p>}
      <button disabled={busy || !isFirebaseConfigured} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5c2e30] px-5 py-3 text-sm font-semibold text-[#fff8ed] transition hover:bg-[#74393a] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-submit-order">{busy && <Loader2 size={16} className="animate-spin" />}Save order request</button>
    </form>
  </ModalShell>;
}

function Home() {
  const [category, setCategory] = useState('All pieces');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [frameOpen, setFrameOpen] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [wishlisted, setWishlisted] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(fallbackProducts);
  const [userEmail, setUserEmail] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const [notice, setNotice] = useState('');
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => subscribeToProducts(
    (remoteProducts) => {
      setCatalogError('');
      if (remoteProducts.length > 0) setCatalog(remoteProducts);
    },
    () => setCatalogError('We could not read the Firebase products collection, so sample pieces are shown instead. Check your Firestore rules and project settings.'),
  ), []);
  useEffect(() => subscribeToAuth((user) => { setUserEmail(user?.email ?? undefined); setUserId(user?.uid); }), []);
  const filtered = useMemo(() => catalog.filter((p) => (category === 'All pieces' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [catalog, category, query]);
  const addToCart = (product: Product) => { setCart((current) => [...current, product]); setNotice(`${product.name} is in your bag`); setCartOpen(true); window.setTimeout(() => setNotice(''), 2600); };
  const removeFromCart = (id: string) => setCart((current) => { const index = current.findIndex((item) => item.id === id); return index >= 0 ? [...current.slice(0, index), ...current.slice(index + 1)] : current; });
  const toggleWish = (id: string) => setWishlisted((current) => current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };
  return <div id="top" className="grain min-h-screen overflow-hidden bg-[#f8f0e2]">
    <Header cartCount={cart.length} userEmail={userEmail} onAccount={() => setAccountOpen(true)} onCart={() => setCartOpen(true)} onSearch={() => setSearchOpen((v) => !v)} onMenu={() => setMenuOpen((v) => !v)} />
    {(searchOpen || menuOpen) && <div className="border-b border-[#5c2e30]/10 bg-[#f4e4d1] px-5 py-4 lg:px-10">
      {searchOpen ? <div className="mx-auto flex max-w-[1320px] items-center gap-4"><Search size={19} className="text-[#d96d4d]" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for something lovely..." className="w-full bg-transparent text-lg text-[#5c2e30] outline-none placeholder:text-[#a1867f]" data-testid="input-search" /><button onClick={() => { setQuery(''); setSearchOpen(false); }} data-testid="button-close-search"><X size={19} /></button></div> : <nav className="mx-auto flex max-w-[1320px] flex-col gap-4 py-2"><a href="#shop" onClick={() => setMenuOpen(false)} data-testid="mobile-link-shop">Shop all</a><a href="#new" onClick={() => setMenuOpen(false)} data-testid="mobile-link-new">New in</a><a href="#personalise" onClick={() => setMenuOpen(false)} data-testid="mobile-link-personalised">Personalised</a><a href="#story" onClick={() => setMenuOpen(false)} data-testid="mobile-link-story">Our story</a></nav>}
    </div>}
    <main>
      <section className="mx-auto grid max-w-[1420px] gap-5 px-5 pb-20 pt-8 sm:pt-10 lg:grid-cols-[.92fr_1.08fr] lg:px-10 lg:pb-28 lg:pt-12">
        <div className="flex flex-col justify-center py-10 lg:py-20"><p className="mono reveal text-[#d96d4d]">Tiny things. Big feelings.</p><h1 className="serif reveal reveal-delay-1 mt-5 max-w-[650px] text-[clamp(4rem,8.3vw,8.2rem)] font-medium leading-[.88] tracking-[-.07em] text-[#5c2e30]">Make it<br /><em className="text-[#d96d4d]">personal.</em></h1><p className="reveal reveal-delay-2 mt-7 max-w-[420px] text-base leading-7 text-[#765d5c]">Jewellery, keepsakes and little gifts for the people who make your world softer.</p><div className="reveal reveal-delay-3 mt-9 flex flex-wrap gap-3"><AppButton testId="button-shop-hero" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>Find a little something <ArrowRight size={15} /></AppButton><a href="#story" className="inline-flex items-center gap-2 rounded-full border border-[#5c2e30]/25 px-6 py-3 text-sm font-semibold text-[#5c2e30] transition hover:bg-[#f2dec8]" data-testid="link-hero-story">Why Proniqa?</a></div></div>
        <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] bg-[#e9c3af] sm:min-h-[600px]"><img src="/images/hero-boutique.jpg" alt="Proniqa jewellery and gifting collection" className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105" data-testid="img-hero" /><div className="absolute bottom-6 left-6 rounded-full bg-[#fff8ed]/90 px-4 py-2 text-[11px] font-semibold tracking-wide text-[#5c2e30]">A small joy, beautifully chosen</div><div className="absolute right-5 top-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8d16a] text-center text-[10px] font-bold uppercase leading-3 tracking-[.1em] text-[#5c2e30]">Made<br />with<br />feeling</div></div>
      </section>
      <section className="border-y border-[#5c2e30]/10 bg-[#edc96c] px-5 py-5 text-[#5c2e30]"><div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 overflow-hidden"><p className="mono whitespace-nowrap">Thoughtful goods for everyday magic</p><div className="hidden h-px flex-1 bg-[#5c2e30]/25 sm:block" /><p className="hidden text-sm sm:block">No occasion required <span className="ml-5">·</span> No occasion required <span className="ml-5">·</span></p><Sparkles size={18} /></div></section>
      <section id="shop" className="mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mono text-[#d96d4d]">The good stuff</p><h2 className="serif mt-2 text-4xl tracking-[-.04em] text-[#5c2e30] sm:text-5xl">Pick your kind of lovely.</h2></div><a href="#shop" className="line-link text-sm font-semibold text-[#5c2e30]" data-testid="link-view-all">View everything <ArrowRight className="ml-2 inline" size={15} /></a></div>
        {catalogError && <div className="mb-6 rounded-2xl border border-[#d96d4d]/30 bg-[#f7d8d2] px-4 py-3 text-sm leading-6 text-[#6d3030]" role="alert" data-testid="status-catalog-error">{catalogError}</div>}
        <div className="mb-10 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition ${category === item ? 'border-[#5c2e30] bg-[#5c2e30] text-[#fff8ed]' : 'border-[#5c2e30]/20 text-[#765d5c] hover:border-[#5c2e30]/50'}`} data-testid={`button-category-${item.toLowerCase().replace(' ', '-')}`}>{item}</button>)}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:gap-x-7">{filtered.map((product) => <ProductCard key={product.id} product={product} wished={wishlisted.includes(product.id)} onWish={() => toggleWish(product.id)} onAdd={() => addToCart(product)} />)}</div>
        {filtered.length === 0 && <div className="rounded-3xl bg-[#f2dec8] py-20 text-center"><p className="serif text-2xl text-[#5c2e30]">Nothing found, but something lovely is close.</p><button onClick={() => { setQuery(''); setCategory('All pieces'); }} className="mt-4 text-sm underline" data-testid="button-clear-search">Clear search</button></div>}
      </section>
      <section id="personalise" className="bg-[#5c2e30] px-5 py-20 text-[#fff8ed] lg:px-10 lg:py-28"><div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.85fr_1.15fr]"><div><p className="mono text-[#edc96c]">Your story, framed</p><h2 className="serif mt-4 text-5xl leading-[.95] tracking-[-.05em] sm:text-7xl">The gift they<br /><em className="text-[#edc96c]">didn't see coming.</em></h2><p className="mt-7 max-w-[400px] leading-7 text-[#f2dcd3]">Turn a date, a place, or an inside joke into something they can keep on the shelf. Choose your frame, add your words, make it yours.</p><AppButton variant="light" className="mt-9" testId="button-customise" onClick={() => setFrameOpen(true)}>Customise a frame <ArrowRight size={15} /></AppButton></div><div className="relative mx-auto w-full max-w-[560px]"><img src="/images/frame-custom.jpg" alt="Personalised frame ready to customise" className="aspect-[1.18] w-full rounded-[1.6rem] object-cover" data-testid="img-custom-frame" /><div className="absolute -bottom-5 -left-3 rounded-xl bg-[#edc96c] px-5 py-4 text-[#5c2e30] shadow-xl sm:-left-6"><p className="mono">Made in your words</p><p className="serif mt-1 text-xl">for keeps.</p></div></div></div></section>
      <section id="new" className="mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28"><div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="mono text-[#d96d4d]">Freshly chosen</p><h2 className="serif mt-3 text-5xl leading-[.98] tracking-[-.05em] text-[#5c2e30]">New things<br /><em>for new memories.</em></h2><p className="mt-6 max-w-[320px] leading-7 text-[#765d5c]">The pieces we are currently obsessed with. Limited little batches, because the best finds should still feel like finds.</p><a href="#shop" className="line-link mt-8 inline-block text-sm font-semibold text-[#5c2e30]" data-testid="link-discover-new">Discover new in <ArrowRight className="ml-2 inline" size={15} /></a></div><div className="grid grid-cols-2 gap-4 sm:gap-6"><div className="relative overflow-hidden rounded-[1.3rem] bg-[#e4c7a9]"><img src="/images/gifting-set.jpg" alt="Curated Proniqa gift box" className="h-full min-h-[300px] w-full object-cover mix-blend-multiply transition duration-700 hover:scale-105" /><span className="absolute bottom-4 left-4 rounded-full bg-[#fff8ed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5c2e30]">For the host</span></div><div className="mt-10 overflow-hidden rounded-[1.3rem] bg-[#e8c5b7] sm:mt-20"><img src="/images/earrings-close.jpg" alt="Golden earrings detail" className="h-full min-h-[300px] w-full object-cover mix-blend-multiply transition duration-700 hover:scale-105" /><div className="p-4"><p className="serif text-xl text-[#5c2e30]">Small, but says a lot.</p><p className="mt-1 text-xs text-[#765d5c]">The everyday edit</p></div></div></div></div></section>
      <section id="story" className="border-y border-[#5c2e30]/10 bg-[#f2dec8] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="overflow-hidden rounded-[2rem] bg-[#e5c4b0]">
              <img src="/images/gifting-set.jpg" alt="A thoughtfully wrapped Proniqa gift" className="aspect-[.9] h-full w-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" data-testid="img-our-story" />
            </div>
            <div className="absolute -bottom-5 -right-3 rounded-2xl bg-[#edc96c] px-5 py-4 text-[#5c2e30] shadow-xl sm:-right-6">
              <p className="mono">No occasion required</p>
              <p className="serif mt-1 text-xl">just a little feeling.</p>
            </div>
          </div>
          <div>
            <p className="mono text-[#d96d4d]">Our story</p>
            <h2 className="serif mt-4 max-w-[680px] text-5xl leading-[.96] tracking-[-.05em] text-[#5c2e30] sm:text-7xl">The good stuff lives in the <em className="text-[#d96d4d]">little things.</em></h2>
            <div className="mt-8 max-w-[590px] space-y-5 text-[15px] leading-7 text-[#765d5c]">
              <p>Proniqa began with a simple question: what if the small moments got to feel just as special as the big ones?</p>
              <p>A first coffee. A hard week. A random Tuesday. We make jewellery, keepsakes and gifts for the quiet ways we say, <em className="text-[#5c2e30]">I thought of you.</em></p>
              <p>Everything is chosen to feel personal, easy to give and lovely to keep. Because the best gifts are not always grand. Sometimes they are just perfectly you.</p>
            </div>
            <div className="mt-9 grid max-w-[620px] gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#fff8ed]/70 p-4"><p className="mono text-[#d96d4d]">01</p><p className="serif mt-2 text-xl text-[#5c2e30]">Thoughtful</p><p className="mt-1 text-xs leading-5 text-[#765d5c]">Chosen with feeling.</p></div>
              <div className="rounded-2xl bg-[#fff8ed]/70 p-4"><p className="mono text-[#d96d4d]">02</p><p className="serif mt-2 text-xl text-[#5c2e30]">Personal</p><p className="mt-1 text-xs leading-5 text-[#765d5c]">Made to mean more.</p></div>
              <div className="rounded-2xl bg-[#fff8ed]/70 p-4"><p className="mono text-[#d96d4d]">03</p><p className="serif mt-2 text-xl text-[#5c2e30]">Keepable</p><p className="mt-1 text-xs leading-5 text-[#765d5c]">For today and after.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28"><div className="mb-10 flex items-end justify-between"><div><p className="mono text-[#d96d4d]">From people with good taste</p><h2 className="serif mt-2 text-4xl tracking-[-.04em] text-[#5c2e30] sm:text-5xl">Little notes, big smiles.</h2></div><div className="hidden gap-2 sm:flex"><button className="rounded-full border border-[#5c2e30]/25 p-3 hover:bg-[#f2dec8]" data-testid="button-testimonial-prev"><ChevronLeft size={16} /></button><button className="rounded-full border border-[#5c2e30]/25 p-3 hover:bg-[#f2dec8]" data-testid="button-testimonial-next"><ChevronRight size={16} /></button></div></div><div className="grid gap-4 md:grid-cols-3"><blockquote className="rounded-[1.4rem] bg-[#edc96c] p-7 text-[#5c2e30]"><span className="text-3xl">“</span><p className="serif mt-4 text-2xl leading-tight">The frame made my sister cry. In the best possible way.</p><footer className="mt-8 text-xs font-semibold tracking-wide">— ANANYA, MUMBAI</footer></blockquote><blockquote className="rounded-[1.4rem] bg-[#d97b60] p-7 text-[#fff8ed]"><span className="text-3xl">“</span><p className="serif mt-4 text-2xl leading-tight">Beautiful packaging, even better little surprises inside.</p><footer className="mt-8 text-xs font-semibold tracking-wide">— RIYA, BENGALURU</footer></blockquote><blockquote className="rounded-[1.4rem] bg-[#e6c9bc] p-7 text-[#5c2e30]"><span className="text-3xl">“</span><p className="serif mt-4 text-2xl leading-tight">I bought one gift and immediately added three things for myself.</p><footer className="mt-8 text-xs font-semibold tracking-wide">— MEERA, DELHI</footer></blockquote></div></section>
      <section className="bg-[#edc96c] px-5 py-16 text-center text-[#5c2e30] lg:py-20"><p className="mono">A little note, now and then</p><h2 className="serif mt-3 text-4xl tracking-[-.04em] sm:text-5xl">Come for the gifts.<br /><em>Stay for the good ideas.</em></h2><div className="mx-auto mt-7 flex max-w-[460px] overflow-hidden rounded-full border border-[#5c2e30]/30 bg-[#fff8ed]/55 p-1"><input placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-5 text-sm outline-none placeholder:text-[#866b65]" data-testid="input-email" /><button onClick={() => setNotice('You are on the list. See you soon.')} className="rounded-full bg-[#5c2e30] px-5 py-3 text-xs font-bold text-[#fff8ed]" data-testid="button-subscribe">Sign me up</button></div></section>
    </main>
    <footer className="bg-[#5c2e30] px-5 py-12 text-[#f8e8d7] lg:px-10"><div className="mx-auto grid max-w-[1320px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"><div><a href="#top" className="serif text-3xl text-[#fff8ed]" data-testid="link-footer-home">proniqa<span className="text-[#edc96c]">.</span></a><p className="mt-4 max-w-[250px] text-sm leading-6 text-[#e7cfc1]">Small, personal things for the people who make ordinary days feel special.</p></div><div><p className="mono mb-4 text-[#edc96c]">Explore</p><div className="space-y-3 text-sm"><a className="block hover:text-[#edc96c]" href="#shop" data-testid="footer-link-shop">Shop all</a><a className="block hover:text-[#edc96c]" href="#new" data-testid="footer-link-new">New in</a><a className="block hover:text-[#edc96c]" href="#personalise" data-testid="footer-link-custom">Personalised</a></div></div><div><p className="mono mb-4 text-[#edc96c]">Help</p><div className="space-y-3 text-sm"><a className="block hover:text-[#edc96c]" href="#top" data-testid="footer-link-contact">Contact us</a><a className="block hover:text-[#edc96c]" href="#top" data-testid="footer-link-shipping">Shipping & returns</a><a className="block hover:text-[#edc96c]" href="#top" data-testid="footer-link-faq">FAQs</a></div></div><div><p className="mono mb-4 text-[#edc96c]">Find us</p><p className="text-sm leading-6 text-[#e7cfc1]">For the soft-hearted<br />@proniqa.studio</p></div></div><div className="mx-auto mt-12 max-w-[1320px] border-t border-[#f8e8d7]/20 pt-5 text-[11px] text-[#cdaea0]">© 2025 Proniqa Studio · Made for keeping</div></footer>
    {notice && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#5c2e30] px-5 py-3 text-sm text-[#fff8ed] shadow-xl" data-testid="status-notice">{notice}</div>}
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onRemove={removeFromCart} onAdd={addToCart} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
    <AuthModal open={accountOpen} onClose={() => setAccountOpen(false)} userEmail={userEmail} onNotice={showNotice} />
    <FrameEnquiryModal open={frameOpen} onClose={() => setFrameOpen(false)} userId={userId} defaultEmail={userEmail} onDone={showNotice} />
    <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} userId={userId} defaultEmail={userEmail} onComplete={() => setCart([])} onDone={showNotice} />
  </div>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;