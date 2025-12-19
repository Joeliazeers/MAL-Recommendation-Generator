const Card = ({ children, className = '', hover = true, onClick }) => {
  return (
    <div 
      className={`
        card p-4
        ${hover ? 'cursor-pointer' : ''}
        ${!hover ? '!transform-none' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card
