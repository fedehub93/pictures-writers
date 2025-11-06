import { redirect } from "next/navigation";

const ShopPage = async () => {
  return redirect(`/draft/shop/ebooks`);
};

export default ShopPage;
