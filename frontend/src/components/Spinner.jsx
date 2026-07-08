const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-emerald-100 border-t-emerald-600`}
    />
  );
};

export default Spinner;
