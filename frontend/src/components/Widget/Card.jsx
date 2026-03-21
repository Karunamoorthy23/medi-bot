function Card({ children, className = '', title, action, flex, style }) {
    return (
        <div className={`card ${className}`} style={style}>
            {(title || action) && (
                <div className="flex-between mb-md">
                    {title && <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div style={flex ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : undefined}>
                {children}
            </div>
        </div>
    );
}

export default Card;
