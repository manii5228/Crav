const ReviewForm = {
    template: `
        <div class="card review-form-card">
            <div class="card-body">
                <h4 class="card-title text-center mb-4">Leave a Review</h4>
                <form @submit.prevent="submitReview">
                    <div class="form-group text-center">
                        <label>Your Rating</label>
                        <div class="star-rating">
                            <span v-for="star in 5"
                                  :key="star"
                                  @click="setRating(star)"
                                  class="star"
                                  :class="{ 'filled': star <= rating }">
                                ★
                            </span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="reviewComment">Your Comment</label>
                        <textarea v-model="comment"
                                  class="form-control"
                                  id="reviewComment"
                                  rows="4"
                                  placeholder="Tell us about your experience...">
                        </textarea>
                    </div>

                    <button type="submit" class="btn btn-brand btn-block mt-4">Submit Review</button>
                </form>
            </div>
        </div>
    `,
    data() {
        return {
            rating: 0,
            comment: ''
        };
    },
    methods: {
        setRating(star) {
            this.rating = star;
        },
        submitReview() {
            if (this.rating === 0) {
                alert('Please select a star rating.');
                return;
            }
            // Emit the review data to the parent component
            this.$emit('review-submitted', {
                rating: this.rating,
                comment: this.comment
            });

            // Reset form
            this.rating = 0;
            this.comment = '';
            alert('Thank you for your review!');
        }
    }
};

export default ReviewForm;