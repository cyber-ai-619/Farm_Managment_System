export function Loading({ message = "Loading..." }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      gap: "1rem",
      color: "var(--color-forest, #1E4632)"
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        border: "3px solid rgba(212, 165, 74, 0.2)",
        borderTop: "3px solid var(--color-gold, #D4A54A)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

export default Loading;
