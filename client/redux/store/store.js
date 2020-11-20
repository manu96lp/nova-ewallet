
import {applyMiddleware, combineReducers, createStore, compose} from 'redux';
import thunk from 'redux-thunk';
import userReducer from '../reducers/userReducer.js'
import transactions from '../reducers/transactions.js'
import contactos from '../reducers/contacts.js'

const rootReducer=combineReducers({
    userReducer:userReducer,
    transactions: transactions,
    contactos:contactos
})
const middleWare  = [thunk];

const composeEnhancer = window.REDUX_DEVTOOLS_EXTENSION_COMPOSE || compose;

const store=createStore(
    rootReducer,
    composeEnhancer(applyMiddleware(...middleWare)),

);

export default store;