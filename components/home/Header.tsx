import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href={"/"} className="flex items-center space-x-3">
          <img src={"/logo.jpg"} alt="CodeLens Logo" className="size-10 rounded-lg" />
          <h1 className="text-2xl font-bold text-white">CodeLens</h1>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <SignedIn>
            <UserButton
              appearance={{
                baseTheme: dark,
                elements: { avatarBox: "h-10 w-10" },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="header-link">
              Login
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
};

export default Header;
