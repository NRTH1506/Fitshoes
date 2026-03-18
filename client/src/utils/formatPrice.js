export function formatPrice(price, currency = 'VND') {
  try {
    if (currency === '$') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    }
    if (currency === 'VND' || currency === '₫' || currency === 'đ') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    }
    return currency + Number(price).toFixed(2);
  } catch {
    return currency + Number(price).toFixed(2);
  }
}
