/**
 * Social namespace socket — post likes, comment reactions, reviews.
 *
 * Stub: connect/join/leave are no-op until backend /social namespace is available.
 * Wire real io('/social') and server events (post_liked, comment_reaction_added, etc.) when ready.
 */

type Listener<T> = (data: T) => void;

class SocialSocket {
  private postLikedListeners = new Set<Listener<{ post_id: string; user_id: string; like_count?: number }>>();
  private postUnlikedListeners = new Set<Listener<{ post_id: string; user_id: string; like_count?: number }>>();
  private commentReactionListeners = new Set<
    Listener<{ comment_id: string; reaction_type: string; user_id: string; count?: number }>
  >();
  private reviewAddedListeners = new Set<Listener<{ product_id: string; review_id: string }>>();

  connect(_userId?: string) {
    // Stub: when backend has /social, io(SOCIAL_URL) and include user_id in emits
  }

  disconnect() {}

  joinPost(_postId: string, _userId: string) {
    // Stub: emit('join_post', { post_id, user_id })
  }

  leavePost(_postId: string, _userId: string) {
    // Stub: emit('leave_post', { post_id, user_id })
  }

  joinProduct(_productId: string, _userId: string) {
    // Stub: emit('join_product', { product_id, user_id })
  }

  leaveProduct(_productId: string, _userId: string) {
    // Stub: emit('leave_product', { product_id, user_id })
  }

  onPostLiked(cb: Listener<{ post_id: string; user_id: string; like_count?: number }>) {
    this.postLikedListeners.add(cb);
    return () => this.postLikedListeners.delete(cb);
  }

  onPostUnliked(cb: Listener<{ post_id: string; user_id: string; like_count?: number }>) {
    this.postUnlikedListeners.add(cb);
    return () => this.postUnlikedListeners.delete(cb);
  }

  onCommentReaction(
    cb: Listener<{ comment_id: string; reaction_type: string; user_id: string; count?: number }>
  ) {
    this.commentReactionListeners.add(cb);
    return () => this.commentReactionListeners.delete(cb);
  }

  onReviewAdded(cb: Listener<{ product_id: string; review_id: string }>) {
    this.reviewAddedListeners.add(cb);
    return () => this.reviewAddedListeners.delete(cb);
  }
}

const socialSocket = new SocialSocket();
export default socialSocket;
