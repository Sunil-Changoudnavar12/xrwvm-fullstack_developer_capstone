import React, { useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png"
import neutral_icon from "../assets/neutral.png"
import negative_icon from "../assets/negative.png"
import review_icon from "../assets/reviewbutton.png"
import Header from '../Header/Header';

const Dealer = () => {


  const [dealer, setDealer] = useState({});
  const [reviews, setReviews] = useState([]);
  const [unreviewed, setUnreviewed] = useState(false);
  const [error, setError] = useState("");
  const [postReview, setPostReview] = useState(<></>)

  let params = useParams();
  let id =params.id;
  let dealer_url = `/djangoapp/dealer/${id}`;
  let reviews_url = `/djangoapp/reviews/dealer/${id}`;
  let post_review = `/postreview/${id}`;
  
  const get_dealer = useCallback(async ()=>{
    const res = await fetch(dealer_url, {
      method: "GET"
    });
    const retobj = await res.json();
    
    if(res.ok) setDealer(retobj.dealer || {});
    else setError(retobj.error || "Could not load dealership details.");
  }, [dealer_url]);

  const get_reviews = useCallback(async ()=>{
    const res = await fetch(reviews_url, {
      method: "GET"
    });
    const retobj = await res.json();
    
    if(res.ok) { setReviews(retobj.reviews || []); setUnreviewed(true); }
    else { setError(retobj.error || "Could not load reviews."); setUnreviewed(true); }
  }, [reviews_url]);

  const senti_icon = (sentiment)=>{
    let icon = sentiment === "positive"?positive_icon:sentiment==="negative"?negative_icon:neutral_icon;
    return icon;
  }

  useEffect(() => {
    get_dealer();
    get_reviews();
    if(sessionStorage.getItem("username")) {
      setPostReview(<a href={post_review}><img src={review_icon} style={{width:'10%',marginLeft:'10px',marginTop:'10px'}} alt='Post Review'/></a>)

      
    }
  }, [get_dealer, get_reviews, post_review]);


return(
  <div style={{margin:"20px"}}>
      <Header/>
      {error && <p role="alert">{error}</p>}
      <div style={{marginTop:"10px"}}>
      <h1 style={{color:"grey"}}>{dealer.full_name}{postReview}</h1>
      <h4  style={{color:"grey"}}>{dealer['city']},{dealer['address']}, Zip - {dealer['zip']}, {dealer['state']} </h4>
      </div>
      <div className="reviews_panel">
      {reviews.length === 0 && unreviewed === false ? (
        <p>Loading reviews...</p>
      ):  reviews.length === 0? <div>No reviews yet! </div> :
      reviews.map(review => (
        <div className='review_panel' key={review.id}>
          <img src={senti_icon(review.sentiment)} className="emotion_icon" alt='Sentiment'/>
          <div className='review'>{review.review}</div>
          <div className="reviewer">{review.name} {review.car_make} {review.car_model} {review.car_year}</div>
        </div>
      ))}
    </div>  
  </div>
)
}

export default Dealer
