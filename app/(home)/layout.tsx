import { Navbar } from "@/components/navbar/navbar";

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <main>{children}</main>
    </div>
  );
};

export default HomeLayout;
