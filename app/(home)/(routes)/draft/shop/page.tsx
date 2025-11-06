import { redirect } from "next/navigation";

const ShopPage = async () => {
  return redirect(`/shop/ebooks`);
};

export default ShopPage;
