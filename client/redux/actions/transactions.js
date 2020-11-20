import axios from 'axios';
export const RECHARGE = "RECHARGE"; 

const API_URL ="192.168.0.209:3000"

export function recharge(transaction){

    return function(dispatch){
      
        return axios.post(`http://${API_URL}/transaction/recharge`, transaction)
        .then(resp=>{
             dispatch({
                type:RECHARGE,
                transaction:resp.data
            }) 
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};
