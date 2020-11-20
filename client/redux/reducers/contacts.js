import { LIST_CONTACTS , DELETE_CONTACTS, ADD_CONTACTO} from '../actions/contacts.js';
import AsyncStorage from '@react-native-community/async-storage';

const initialState = {  
    listaContactos:[],
    contacto:"",
};

export default (state = initialState, action) => {
    switch (action.type) {
        case LIST_CONTACTS:
            return {
                ...state,
                listaContactos:action.contactos
            }
        case DELETE_CONTACTS:
            console.log( action.contacto)
            return{
                ...state,
                listaContactos: state.listaContactos.filter(cont=>cont.id !== action.contacto.id)
            }
        case ADD_CONTACTO:

            return{
                ...state,
                listaContactos: state.listaContactos.concat(action.contacto)
            }
        default:
            return state;
    }

}


