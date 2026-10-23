import React, { useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';


const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState();
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);

  let params = useParams();
  let id =params.id;
  let dealer_url = `/djangoapp/dealer/${id}`;
  let review_url = "/djangoapp/add_review";
  let carmodels_url = "/djangoapp/get_cars";

  const postreview = async ()=>{
    let name = sessionStorage.getItem("firstname")+" "+sessionStorage.getItem("lastname");
    //If the first and second name are stores as null, use the username
    if(name.includes("null")) {
      name = sessionStorage.getItem("username");
    }
    if(!model || review === "" || date === "" || year === "" || model === "") {
      alert("All details are mandatory")
      return;
    }

    const [make_chosen, model_chosen] = model.split("|||");
    if (!make_chosen || !model_chosen || Number(year) < 2015 || Number(year) > 2023) {
      alert("Choose a listed vehicle and a year from 2015 to 2023.");
      return;
    }

    let jsoninput = JSON.stringify({
      "name": name,
      "dealership": id,
      "review": review,
      "purchase": true,
      "purchase_date": date,
      "car_make": make_chosen,
      "car_model": model_chosen,
      "car_year": year,
    });

    const res = await fetch(review_url, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: jsoninput,
  });

  const json = await res.json();
  if (res.ok) {
      window.location.href = `/dealer/${id}`;
  } else {
      alert(json.error || "The review could not be submitted.");
  }

  }
  const get_dealer = useCallback(async ()=>{
    const res = await fetch(dealer_url, {
      method: "GET"
    });
    const retobj = await res.json();
    
    if(res.ok) setDealer(retobj.dealer || {});
  }, [dealer_url]);

  const get_cars = useCallback(async ()=>{
    const res = await fetch(carmodels_url, {
      method: "GET"
    });
    const retobj = await res.json();
    
    let carmodelsarr = retobj.CarModels || []
    setCarmodels(carmodelsarr)
  }, [carmodels_url]);
  useEffect(() => {
    get_dealer();
    get_cars();
  }, [get_dealer, get_cars]);


  return (
    <div>
      <Header/>
      <div  style={{margin:"5%"}}>
      <h1 style={{color:"darkblue"}}>{dealer.full_name}</h1>
      <textarea id='review' cols='50' rows='7' onChange={(e) => setReview(e.target.value)}></textarea>
      <div className='input_field'>
      Purchase Date <input type="date" onChange={(e) => setDate(e.target.value)}/>
      </div>
      <div className='input_field'>
      Car Make 
      <select name="cars" id="cars" onChange={(e) => setModel(e.target.value)}>
      <option value="" disabled hidden>Choose Car Make and Model</option>
      {carmodels.map(carmodel => (
          <option key={carmodel.id} value={`${carmodel.CarMake}|||${carmodel.CarModel}`}>{carmodel.CarMake} {carmodel.CarModel}</option>
      ))}
      </select>        
      </div >

      <div className='input_field'>
      Car Year <input type="number" onChange={(e) => setYear(e.target.value)} max={2023} min={2015}/>
      </div>

      <div>
      <button className='postreview' onClick={postreview}>Post Review</button>
      </div>
    </div>
    </div>
  )
}
export default PostReview
