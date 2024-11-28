import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProductCategory, UserRole } from "@prisma/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ProductForm } from "./_components/product-form";

const ProductIdPage = async ({ params }: { params: { rootId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const product = await db.product.findFirst({
    where: {
      rootId: params.rootId,
    },
    include: {
      user: true,
      seo: true,
      gallery: {
        select: {
          mediaId: true,
          sort: true,
          media: true,
        },
      },
      imageCover: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!product || !product.rootId) {
    redirect("/admin/products");
  }

  let authors = undefined;
  if (product.category === ProductCategory.EBOOK) {
    authors = await db.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.EDITOR],
        },
      },
    });
  }

  return (
    <ProductForm
      initialData={product}
      apiUrl={`/api/products/${product.rootId}`}
      authors={authors}
    />
  );
};

export default ProductIdPage;
