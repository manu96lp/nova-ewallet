import axios from 'axios';
export const ADD_USER = "ADD_USER";
export const LOGIN_USER = "LOGIN_USER";
export const USER_BY_ID ="USER_BY_ID";
const API_URL ="192.168.0.209:3000"

export function createUser(user){

    return function(dispatch){
      
        return axios.post(`http://${API_URL}/user/`, user)
        .then(resp=>{
            dispatch({
                type:ADD_USER,
                user:resp.data
            })
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};


export function login (data){

    return function(dispatch){
      
        return axios.post(`http://${API_URL}/auth/login`, data)
        .then( resp =>{
            dispatch({
                type:LOGIN_USER,
                user:resp.data
            })
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};

export function refresh (data){

    return function(dispatch){
        return axios.get(`http://${API_URL}/user/user/${data}`)
        .then( resp =>{
            dispatch({
                type:USER_BY_ID,
                user:resp.data
            })
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};
//http://localhost:3000/user/user/1

