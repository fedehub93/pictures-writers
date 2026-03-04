import * as LucideIcons from "lucide-react";

interface ServiceBoxsProps {
  features: { title: string; Icon: string; description: string }[];
}

export const ServiceBoxs = ({ features }: ServiceBoxsProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-6 lg:max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-foreground mb-6">
            Cosa Analizziamo
          </h2>
          <p className="text-muted-foreground text-md max-w-lg mx-auto">
            Ogni report è strutturato per coprire i pilastri fondamentali della
            narrativa professionale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const IconComp = (LucideIcons as any)[f.Icon];
            return (
              <div
                key={f.title}
                className="p-8 bg-accent/50 rounded-4xl border border-accent hover:border-primary/20 transition-all group"
              >
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                  <IconComp className="size-8" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3">
                  {f.title}
                </h4>
                <p className="text-md text-secondary-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
