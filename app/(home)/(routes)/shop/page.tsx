import { CategoryList } from "./_components/category-list";

const ShopPage = async () => {
  return (
    <div>
      <section className="py-20 border-b border-b-accent">
        <div className="container mx-auto px-6 text-center">
          <div className="uppercase inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-bold tracking-widest mb-6">
            Pictures Writers Shop
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-8 leading-tight">
            Migliora la tua{" "}
            <span className="text-primary italic">Carriera Creativa</span>
          </h1>
          <p className="text-secondary-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Dalle analisi professionali ai corsi intensivi, tutto ciò di cui hai
            bisogno per elevare la tua scrittura cinematografica.
          </p>
        </div>
      </section>
      <section className="bg-white py-4">
        <div className="max-w-6xl w-full mx-auto py-8 px-4 xl:px-0">
          <CategoryList />
        </div>
      </section>
    </div>
  );
};

export default ShopPage;
