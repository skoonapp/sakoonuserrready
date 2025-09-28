import React, { useState } from 'react';
import type { Listener } from '../types';
import { functions } from '../utils/firebase';

// Icons
const StarIcon: React.FC<{ filled: boolean, className?: string }> = ({ filled, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${className} ${filled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>
        <path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.134-.662 1.456 0l1.86 3.844 4.242.617c.727.106 1.018.995.494 1.505l-3.07 2.992.724 4.225c.124.724-.63.1.277-1.188.354L12 15.011l-3.766 1.979c-.618.324-1.312-.24-1.188-.938l.724-4.225-3.07-2.992c-.524-.51-.233-1.399.494-1.505l4.242-.617 1.86-3.844z" clipRule="evenodd" />
    </svg>
);

interface RatingModalProps {
    listener: Listener;
    onClose: (submitted: boolean) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ listener, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }
        setStatus('submitting');
        setError('');
        try {
            const submitReview = functions.httpsCallable('submitListenerReview');
            await submitReview({
                listenerId: listener.id,
                rating: rating,
                text: reviewText.trim()
            });
            setStatus('success');
            setTimeout(() => onClose(true), 1500); // Close after showing success
        } catch (err: any) {
            console.error("Failed to submit review:", err);
            setError(err.message || "Could not submit your feedback. Please try again.");
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thank You!</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Your feedback helps us improve.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => onClose(false)}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <img src={listener.image} alt={listener.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white dark:border-slate-800 shadow-lg -mt-16" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">Rate your session with</h3>
                <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">{listener.name}</p>

                <div className="flex justify-center my-6" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} className="focus:outline-none transform hover:scale-125 transition-transform">
                            <StarIcon filled={(hoverRating || rating) >= star} className="w-10 h-10" />
                        </button>
                    ))}
                </div>

                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us more (optional)..."
                    rows={3}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition text-sm mb-4"
                />

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => onClose(false)} className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Skip</button>
                    <button onClick={handleSubmit} disabled={status === 'submitting'} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg disabled:bg-slate-400">
                        {status === 'submitting' ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
