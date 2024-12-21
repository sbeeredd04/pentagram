"use client";
import React, { JSX } from "react";
import { cn } from "../lib/utils";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex max-w-fit sticky top-0 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-4 pl-10 py-3 my-2 items-center justify-center space-x-6",
        className
      )}
    >
      {navItems.map((navItem: { name: string; link: string; icon?: JSX.Element }, idx: number) => (
        <Link
          key={`link=${idx}`}
          href={navItem.link}
          className={cn(
            "relative dark:text-neutral-50 items-center flex space-x-2 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500"
          )}
        >
          <span className="block sm:hidden">
            {navItem.icon && <FontAwesomeIcon icon={navItem.icon.props.icon} />}
          </span>
          <span className="hidden sm:block text-sm">{navItem.name}</span>
        </Link>
      ))}
    </div>
  );
};