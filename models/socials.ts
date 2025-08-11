export interface Review {
    id: number;
    rating: number;
    text: string;
    user: {
      id: string;
      username: string;
      profile_picture_url: string;
    };
    created_at: string;
    updated_at: string;
    upvotes: number;
  }
  
  export interface CreateReviewRequest {
    rating: number;
    text: string;
  }
  