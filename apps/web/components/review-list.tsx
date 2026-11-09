import { Stars } from '@/components/stars';
import type { PublicReview } from '@/app/actions/session';

/** Customer reviews for the product page. Names are first names only; comments are plain text (React escapes them). */
export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  return <section className="reviews" aria-labelledby="reviews-h">
    <h2 id="reviews-h">Customer reviews</h2>
    {reviews.length === 0 ? <p className="notice">No reviews yet. Customers can review a food after their order is delivered.</p>
      : <ul>{reviews.map((review) => <li key={review.id}>
        <div><strong>{review.name}</strong> <Stars sum={review.rating} count={1} showCount={false} /> <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : ''}</small></div>
        {review.comment && <p>{review.comment}</p>}
      </li>)}</ul>}
  </section>;
}
