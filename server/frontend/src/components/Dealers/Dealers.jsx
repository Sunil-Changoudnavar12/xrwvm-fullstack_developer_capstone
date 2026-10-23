import React, { useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png"

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  let [states, setStates] = useState([])
  const [error, setError] = useState("");
 
  const filterDealers = async (state) => {
    const res = await fetch(`/djangoapp/get_dealers/${encodeURIComponent(state || "All")}`);
    const retobj = await res.json();
    if (res.ok) setDealersList(retobj.dealers || []);
    else setError(retobj.error || "Could not load dealerships.");
  }

  const get_dealers = async ()=>{
    const res = await fetch("/djangoapp/get_dealers");
    const retobj = await res.json();
    if(res.ok) {
      let all_dealers = retobj.dealers || []
      let states = [];
      all_dealers.forEach((dealer)=>{
        states.push(dealer.state)
      });

      setStates(Array.from(new Set(states)))
      setDealersList(all_dealers)
    } else setError(retobj.error || "Could not load dealerships.");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    get_dealers();
  },[]);


let isLoggedIn = sessionStorage.getItem("username") != null ? true : false;
return(
  <div>
      <Header/>

      {error && <p role="alert">{error}</p>}
     <table className='table'>
      <thead>
      <tr>
      <th>ID</th>
      <th>Dealer Name</th>
      <th>City</th>
      <th>Address</th>
      <th>Zip</th>
      <th>
      <select name="state" id="state" onChange={(e) => filterDealers(e.target.value)}>
      <option value="" disabled hidden>State</option>
      <option value="All">All States</option>
      {states.map(state => (
          <option key={state} value={state}>{state}</option>
      ))}
      </select>        

      </th>
      {isLoggedIn ? (
          <th>Review Dealer</th>
         ):<></>
      }
      </tr>
      </thead>
      <tbody>
     {dealersList.map(dealer => (
        <tr key={dealer.id}>
          <td>{dealer['id']}</td>
          <td><a href={'/dealer/'+dealer['id']}>{dealer['full_name']}</a></td>
          <td>{dealer['city']}</td>
          <td>{dealer['address']}</td>
          <td>{dealer['zip']}</td>
          <td>{dealer['state']}</td>
          {isLoggedIn ? (
            <td><a href={`/postreview/${dealer['id']}`}><img src={review_icon} className="review_icon" alt="Post Review"/></a></td>
           ):<></>
          }
        </tr>
      ))}
      </tbody>
     </table>
  </div>
)
}

export default Dealers
