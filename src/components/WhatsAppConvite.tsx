"use client";
import { usePathname } from "next/navigation";

// Link de convite do grupo "Casa Forte & Corretores" no WhatsApp.
const GRUPO_WHATSAPP_URL = "https://chat.whatsapp.com/EJdKqGO1kjL5FKosR4dGn2";

// Botão flutuante convidando o corretor para o grupo. Aparece em todas as
// páginas voltadas ao corretor; some nas telas internas (/admin).
export function WhatsAppConvite() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (!GRUPO_WHATSAPP_URL || GRUPO_WHATSAPP_URL.includes("XXXX")) return null;

  return (
    <a
      href={GRUPO_WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Entrar no grupo Casa Forte & Corretores no WhatsApp"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: 60,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 16px",
        background: "#25D366",
        color: "white",
        borderRadius: "9999px",
        fontSize: "14px",
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 6px 20px rgba(37,211,102,0.4)",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.59 4.462 1.712 6.406L3.2 28.8l6.57-1.72a12.74 12.74 0 006.23 1.626h.005c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.706-12.8-12.706zm0 23.02h-.004a10.6 10.6 0 01-5.4-1.48l-.387-.23-4.01 1.05 1.07-3.907-.252-.4a10.56 10.56 0 01-1.62-5.653c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.107 7.52 3.117a10.56 10.56 0 013.11 7.52c0 5.86-4.77 10.613-10.63 10.613zm5.83-7.957c-.32-.16-1.89-.933-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.498-2.57-1.587-.95-.847-1.59-1.893-1.777-2.213-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.623-.524-.539-.72-.549l-.613-.011c-.213 0-.56.08-.853.4-.293.32-1.12 1.094-1.12 2.667 0 1.573 1.146 3.093 1.306 3.307.16.213 2.256 3.443 5.466 4.827.764.33 1.36.527 1.824.674.767.244 1.464.21 2.015.127.615-.092 1.89-.773 2.157-1.52.266-.746.266-1.386.186-1.52-.08-.133-.293-.213-.613-.373z"/>
      </svg>
      {"Grupo Casa Forte & Corretores"}
    </a>
  );
}
