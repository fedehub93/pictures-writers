import { Navbar } from "@/components/navbar/navbar";
import { cn } from "@/lib/utils";
import { Mulish } from "next/font/google";
import Footer from "./_components/footer";

const mulish = Mulish({ subsets: ["latin"] });

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={cn(`h-full`, mulish.className)}>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
};

export default HomeLayout;
