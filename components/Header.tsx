import Link from "next/link";
import React from "react";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";

const Header = () => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <img
            src="/assets/icons/logo.svg"
            alt="Stocket Logo"
            width={140}
            height={32}
            className="h-8 w-auto cursor-pointer"
          ></img>
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
          <UserDropdown />
      </div>
    </header>
  );
};

export default Header;
