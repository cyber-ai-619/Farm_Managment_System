import { useEffect } from "react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "560px" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(18, 46, 32, 0.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: "20px",
        overflowY: "auto",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid rgba(212, 165, 74, 0.35)",
          boxShadow: "0 24px 48px rgba(18, 46, 32, 0.28)",
          position: "relative",
          overflow: "hidden",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Foil Stripe */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(100deg, #D4A54A 0%, #F0C878 30%, #7A4A52 70%, #1E4632 100%)",
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(30, 70, 50, 0.1)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "1.3rem",
              color: "var(--color-forest, #1E4632)",
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              lineHeight: 1,
              cursor: "pointer",
              color: "#7A4A52",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px", maxHeight: "calc(85vh - 100px)", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
