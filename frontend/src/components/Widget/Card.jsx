function Card({ children, className = '', title, action, flex, style }) {
    const hasHeader = title || action;
    const contentStyle = flex ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : undefined;

    return (
        <div className={`card ${className}`} style={style}>
            {hasHeader && (
                <div className="flex-between mb-md">
                    {title && <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {/* Only wrap if we need to apply flex styles or if we have a header already */}
            {flex || hasHeader ? (
                <div style={contentStyle}>
                    {children}
                </div>
            ) : (
                children
            )}
        </div>
    );
}

export default Card;
