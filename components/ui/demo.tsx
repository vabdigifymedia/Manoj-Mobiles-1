import { ProductCard } from "@/components/ui/product-card-1";

// Sample data for the product card
const productData = {
  imageUrl: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/8/w/5/-original-imah4jyfwr3bfjbg.jpeg?q=70", // Placeholder image link
  title: "Apple iPhone 16 (Black, 256 GB)",
  rating: 4.6,
  ratingsCount: 19106,
  reviewsCount: 793,
  specifications: [
    "256 GB ROM",
    "15.49 cm (6.1 inch) Super Retina XDR Display",
    "48MP + 12MP | 12MP Front Camera",
    "A18 Chip, 6 Core Processor",
    "1 year warranty for phone and 1 year warranty for in Box Accessories.",
  ],
  price: 64999,
  originalPrice: 79999,
  isAssured: true,
  exchangeOffer: "52,450",
  bankOffer: "Bank Offer",
};

export default function ProductCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <ProductCard {...productData} />
    </div>
  );
}
