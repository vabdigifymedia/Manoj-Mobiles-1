"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Heart, Star, ShieldCheck, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming you have a shadcn Checkbox component
import { Button } from "@/components/ui/button"; // Assuming you have a shadcn Button component

import { HTMLMotionProps } from "framer-motion";

// Define the types for the component props
interface ProductCardProps extends HTMLMotionProps<"div"> {
  imageUrl: string;
  title: string;
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  specifications: string[];
  price: number;
  originalPrice: number;
  isAssured: boolean;
  exchangeOffer: string;
  bankOffer: string;
  href?: string;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      className,
      imageUrl,
      title,
      rating,
      ratingsCount,
      reviewsCount,
      specifications,
      price,
      originalPrice,
      isAssured,
      exchangeOffer,
      bankOffer,
      href,
      ...props
    },
    ref
  ) => {
    const [isWishlisted, setIsWishlisted] = React.useState(false);

    // Format numbers with commas for readability
    const formatNumber = (num: number) =>
      new Intl.NumberFormat("en-IN").format(num);

    // Calculate discount percentage
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

    // Animation variants for framer-motion
    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative bg-background text-foreground border-b md:border-b-0 md:border md:rounded-lg w-full py-4 md:p-6",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{
          boxShadow: "0px 10px 30px -5px hsl(var(--foreground) / 0.1)",
          y: -5,
        }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-0 md:right-2 rounded-full z-10"
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label="Toggle Wishlist"
        >
          <Heart
            className={cn(
              "h-5 w-5 text-muted-foreground transition-colors",
              isWishlisted && "fill-red-500 text-red-500"
            )}
          />
        </Button>

        <Link href={href || "#"} className="block w-full h-full cursor-pointer">
          <div className="grid grid-cols-[110px_1fr] md:grid-cols-[1fr_2fr_1.5fr] gap-3 md:gap-6 items-start">
            {/* Column 1: Image & Compare */}
            <div className="flex flex-col items-center gap-2 md:gap-4 col-span-1">
              <div className="relative w-full aspect-[3/4] md:aspect-square max-w-[110px] md:max-w-[200px] mx-auto bg-white rounded-md md:rounded-lg p-1 md:p-2">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-contain mix-blend-multiply"
                />
              </div>
              <div className="hidden md:flex items-center space-x-2 self-start md:self-center pt-2 md:pt-4" onClick={(e) => e.preventDefault()}>
                <Checkbox id={`compare-${title}`} />
                <label
                  htmlFor={`compare-${title}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Add to Compare
                </label>
              </div>
            </div>

            {/* Mobile wrapper for details and pricing */}
            <div className="flex flex-col gap-1.5 md:contents">
              {/* Column 2: Product Details */}
              <div className="flex flex-col gap-1 md:gap-3 pr-8 md:pr-0">
                <h2 className="text-[15px] md:text-lg font-normal md:font-semibold text-foreground line-clamp-2 leading-tight hover:text-blue-600 cursor-pointer">{title}</h2>
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                  <div className="bg-green-600 text-white px-1 py-0.5 rounded-sm flex items-center gap-0.5 font-medium text-[10px] md:text-xs">
                    <span>{rating.toFixed(1)}</span>
                    <Star className="h-2 w-2 md:h-3 md:w-3 fill-white" />
                  </div>
                  <span className="text-[11px] md:text-sm">
                    ({formatNumber(ratingsCount)})
                  </span>
                  {isAssured && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" fill="currentColor" stroke="white" strokeWidth={1.5} />
                      <span className="font-bold italic text-blue-700 dark:text-blue-400 text-[10px] md:text-xs leading-none tracking-tight">
                        Assured
                      </span>
                    </div>
                  )}
                </div>
                <ul className="hidden md:block space-y-2 text-sm list-disc list-inside text-muted-foreground pt-2">
                  {specifications.map((spec, index) => (
                    <li key={index}>{spec}</li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Pricing */}
              <div className="flex flex-col gap-0.5 md:gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-green-600 font-semibold text-[13px] md:text-sm flex items-center">
                    ↓{discount}%
                  </span>
                  <span className="text-muted-foreground line-through text-[13px] md:text-sm">
                    ₹{formatNumber(originalPrice)}
                  </span>
                  <h3 className="text-base md:text-3xl font-semibold">₹{formatNumber(price)}</h3>
                </div>
                <p className="text-[11px] md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Upto ₹{exchangeOffer} Off on Exchange</p>
                <p className="text-[11px] md:text-sm font-medium text-green-600">
                  {bankOffer}
                </p>
                <p className="text-[11px] md:text-sm text-slate-600 mt-0.5 flex items-center gap-1">
                  <Truck className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="font-bold italic text-black dark:text-white">EXPRESS</span> Delivery tomorrow
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export { ProductCard };
