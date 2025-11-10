export const parseDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const isFuture = diffMs < 0;
    const diffInDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

    const format = (n: number, unit: string) =>
        `${n} ${unit}${n !== 1 ? 's' : ''} ${isFuture ? 'from now' : 'ago'}`;

    // same day: show hours/minutes or "just now"
    if (diffInDays === 0) {
        const absMs = Math.abs(diffMs);
        const hours = Math.floor(absMs / (1000 * 60 * 60));
        if (hours > 0) return isFuture ? `in ${hours} hour${hours !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        const minutes = Math.floor(absMs / (1000 * 60));
        if (minutes > 0) return isFuture ? `in ${minutes} minute${minutes !== 1 ? 's' : ''}` : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        return isFuture ? 'in a few seconds' : 'just now';
    }

    if (diffInDays === 1) return isFuture ? 'in 1 day' : 'Yesterday';
    if (diffInDays < 7) return format(diffInDays, 'day');
    if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7) || 1;
        return format(weeks, 'week');
    }
    if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30) || 1;
        return format(months, 'month');
    }
    const years = Math.floor(diffInDays / 365) || 1;
    return format(years, 'year');
};