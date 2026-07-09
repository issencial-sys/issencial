import { type CSSProperties, type ReactNode } from "react";

export interface ChevronCardProps {
  children?: ReactNode;
  /** Cor de preenchimento do polígono. Default: #D7DE6B */
  color?: string;
  /** Conteúdo a renderizar por cima do SVG. */
  className?: string;
  /** Classe extra aplicada ao wrapper externo. */
  contentClassName?: string;
  /** Estilo extra para o wrapper. */
  style?: CSSProperties;
}

/**
 * Card em formato de hexágono irregular (chave de boca / "tag chevron"),
 * com bicos assimétricos à esquerda e à direita.
 *
 * Geometria decalcada de pixel de asset de design real:
 *   - viewBox: 2806 x 884 (~3.17:1)
 *   - vértices (sentido horário a partir do canto superior esquerdo):
 *       1. (103.82,    0   )  topo-esquerda     (3.7%,  0%)
 *       2. (2336.99,   0   )  topo-direita      (83.3%, 0%)
 *       3. (2806,    700.91)  ponta direita     (100%, 79.3%)
 *       4. (2702.18, 884   )  base-direita      (96.3%, 100%)
 *       5. (190.81,  884   )  base-esquerda     (6.8%,  100%)
 *       6. (0,      183.87)  ponta esquerda    (0%,   20.8%)
 *
 * Mantém-se a proporção 2806/884 via aspect-ratio, pelo que a forma nunca
 * distorce ao redesenhar.
 */
export function ChevronCard({
  children,
  color = "#D7DE6B",
  className,
  contentClassName,
  style,
}: ChevronCardProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        ...style,
      }}
    >
      <svg
        viewBox="0 0 2806 884"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <polygon
          points="103.82,0 2336.99,0 2806,700.91 2702.18,884 190.81,884 0,183.87"
          fill={color}
        />
      </svg>

      {children !== undefined && (
        <div
          className={`flex items-center justify-center ${contentClassName || ""}`}
          style={{
            position: "absolute",
            inset: 0,
            paddingInline: "14%",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default ChevronCard;
