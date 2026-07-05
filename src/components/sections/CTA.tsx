import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="bg-accent py-16 md:py-20 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <h2 className="text-3xl font-bold text-primary mb-4">Pronto para simplificar os seus processos?</h2>
        <p className="text-lg text-primary/80 mb-8 max-w-xl mx-auto">
          Entre em contacto connosco e descubra como podemos ajudá-lo a concretizar os seus objetivos.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button href="/contacto" variant="secondary" size="lg">
            Fale Connosco
            <ArrowRight size={18} />
          </Button>
          <Button href="/servicos" variant="outline" size="lg">
            Ver Serviços
          </Button>
        </div>
      </div>
    </section>
  );
}
