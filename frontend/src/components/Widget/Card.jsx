function Card({ children, className = '', title, action }) {
    return (
        <div className={`card ${className}`}>
            {(title || action) && (
                <div className="flex-between mb-md">
                    {title && <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}

export default Card;
