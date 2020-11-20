import axios from 'axios';
export const  LIST_CONTACTS = "LIST_CONTACTS";
export const DELETE_CONTACTS = "DELETE_CONTACTS"
export const UPDATE_CONTACTS = "UPDATE_CONTACTS"
export const ADD_CONTACTO = "ADD_CONTACTO"
const API_URL ="192.168.0.209:3000"

export function allContacts(id){

    return function(dispatch){
        
        return axios.get(`http://${API_URL}/contact/${id}`)
        .then(resp=>{
            console.log(resp.data)
             dispatch({
                type:LIST_CONTACTS,
                contactos:resp.data
            }) 
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};
export function deleteContact(id){

    return function(dispatch){
        
        return axios.delete(`http://${API_URL}/contact/${id}`)
        .then(resp=>{
            console.log(resp.data)
             dispatch({
                type:DELETE_CONTACTS,
                contacto:resp.data
            }) 
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};


export function addContact(contacto){

    return function(dispatch){
        
        return axios.post(`http://${API_URL}/contact/add`,contacto)
        .then(resp=>{
            console.log(resp.data)
             dispatch({
                type:ADD_CONTACTO,
                contacto:resp.data
            }) 
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};

export function updateContact(id){

    return function(dispatch){
        
        return axios.put(`http://${API_URL}/contact/${id}`)
        .then(resp=>{
            console.log(resp.data)
             dispatch({
                type:UPDATE_CONTACTS,
                contacto:resp.data
            }) 
        })
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };
};