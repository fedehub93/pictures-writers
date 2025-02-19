import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProductType, UserRole } from "@prisma/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ProductForm } from "./_components/product-form";

const ProductIdPage = async (props: { params: Promise<{ rootId: string }> }) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
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
  if (product.type === ProductType.EBOOK) {
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
