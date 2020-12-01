"use strict";

const { generateRandomKey } = require( "../helpers/common" );

const DbService = require( "../mixins/db.mixin" );
const CacheCleanerMixin = require( "../mixins/cache.cleaner.mixin" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "transactions",
	
	mixins: [
		DbService( "transactions" ),
		CacheCleanerMixin( [
			"cache.clean.accounts",
			"cache.clean.transactions"
		] )
	],
	
	settings: {
		fields: [ "code", "involved", "amount", "type", "data", "currency", "createdAt" ],
		
		entityValidator: {
			account: { type: "string" },
			
			code: { type: "string" },
			involved: { type: "string" },
			amount: { type: "number" },
			type: { type: "enum", values: [ "recharge", "transfer", "send", "debit" ] },
			currency: { type: "enum", values: [ "ARS", "USD" ] },
			data: { type: "object", optional: true },
			
			createdAt: { type: "date", default: ( ) => new Date( ) }
		}
	},
	
	actions: {
		/**
		 * Create a new transaction
		 *
		 * @actions
		 * 
		 * @param {String} account - Account whos affected by the transaction
		 * @param {String} involved - Entity involved (store code, cvu, receiver id, etc)
		 * @param {Number} amount - Transaction amount
		 * @param {String} type - Type of transaction [recharge, transfer, send, debit]
		 * @param {String} currency - Currency [ARS, USD]
		 * @param {Object} data - Optional data (i.e. store address)
		 * @param {String} createdAt - Optional creation datetime (defaults to current datetime)
		 *
		 * @returns {Object} Created transaction
		 */
		create: {
			params: {
				account: { type: "string" },
				involved: { type: "string" },
				amount: { type: "number" },
				type: { type: "string" },
				currency: { type: "string" },
				data: { type: "object", optional: true },
				createdAt: { type: "date", optional: true }
			},
			
			async handler( ctx )
			{
				const { account, involved, amount, type, currency, data, createdAt } = ctx.params;
				const entity = { account, involved, amount, type, currency, data, createdAt };
				
				do
				{
					entity.code = generateRandomKey( 16, "alphanumeric" );
				}
				while ( await this.findByCode( entity.code ) )
				
				await this.validateEntity( entity );
				
				const result = await this.adapter.insert( entity );
				const json = await this.transformDocuments( ctx, { }, result );
				
				await this.entityChanged( "created", json, ctx );
				
				return json;
			}
		},
		
		/**
		 * List of transactions with pagination
		 *
		 * @actions
		 * 
		 * @param {String} account - Account id
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 *
		 * @returns {Object} List of transactions
		 */
		list: {
			cache: {
				keys: [ "account", "limit", "offset" ],
				ttl: 300
			},
			params: {
				account: { type: "string" },
				offset: { type: "number" },
				limit: { type: "number" }
			},
			
			async handler( ctx )
			{
				const params = {
					limit: ctx.params.limit,
					offset: ctx.params.offset,
					sort: [ "-createdAt" ],
					query: {
						account: ctx.params.account
					}
				};
				
				const countParams = Object.assign( { }, params );
				
				delete countParams.limit;
				delete countParams.offset;
				delete countParams.sort;

				const res = await this.Promise.all( [
					this.adapter.find( params ),
					this.adapter.count( countParams )
				] );
				
				const jsons = await this.transformDocuments( ctx, params, res[ 0 ] );
				const tents = await this.transformResults( jsons );
				
				return {
					rows: tents,
					count: res[ 1 ]
				};
			}
		},
		
		/**
		 * List of transactions for a period
		 *
		 * @actions
		 * 
		 * @param {String} account - Account id
		 * @param {Date} startDate - Period start date
		 * @param {Date} endDate - Period end date
		 *
		 * @returns {Object} List of transactions
		 */
		period: {
			cache: {
				keys: [ "account", "startDate", "endDate" ],
				ttl: 300
			},
			params: {
				account: { type: "string" },
				startDate: { type: "date", convert: true },
				endDate: { type: "date", convert: true }
			},
			
			async handler( ctx )
			{
				this.verifyPeriodDates( ctx.params.startDate, ctx.params.endDate );
				
				const params = {
					sort: [ "-createdAt" ],
					query: {
						"$and": [
							{ account: ctx.params.account },
							{ createdAt: { "$gt": ctx.params.startDate } },
							{ createdAt: { "$lt": ctx.params.endDate } }
						]
					}
				};
				
				const countParams = Object.assign( { }, params );
				
				delete countParams.sort;

				const res = await this.Promise.all( [
					this.adapter.find( params ),
					this.adapter.count( countParams )
				] );
				
				const jsons = await this.transformDocuments( ctx, params, res[ 0 ] );
				const tents = await this.transformResults( jsons );
				
				return {
					rows: tents,
					count: res[ 1 ]
				};
			}
		}
	},
	
	methods: {
		/**
		 * Find a transaction by code
		 * 
		 * @methods
		 * 
		 * @param {String} code
		 * 
		 * @return {Object} Transaction
		 */
		findByCode( code ) {
			if ( !code ) {
				return null;
			}
			
			return this.adapter.findOne( { code } );
		},
		
		/**
		 * Verifies start and end dates of a period
		 * 
		 * @methods
		 * 
		 * @param {Date} startDate - Period start
		 * @param {Date} endDate - Period end
		 * 
		 * @return {Boolean} True if valid, exception otherwise
		 */
		verifyPeriodDates( startDate, endDate ) {
			if ( !( startDate instanceof Date ) || !( endDate instanceof Date ) ) {
				throw new MoleculerClientError( "Not all period's dates are instances of Date" );
			}
			
			const startDateTime = startDate.getTime( ) / 86400000 | 0;
			const endDateTime = endDate.getTime( ) / 86400000 | 0;
			
			if ( startDateTime >= endDateTime ) {
				throw new MoleculerClientError( "Period start can\'t be greater than period end" );
			}
			
			if ( ( endDateTime - startDateTime ) > 60 ) {
				throw new MoleculerClientError( "Period can\'t be more than 60 days" );
			}
		},
		
		/**
		 * Transform results
		 * 
		 * @methods
		 *
		 * @param {Array} results
		 * 
		 * @return {Array} Transformed results
		 */
		transformResults( results )
		{
			if ( !Array.isArray( results ) || ( results.length === 0 ) ) {
				return [ ];
			}
			
			const entities = results.map( ( r ) => this.transformEntity( r ) );
			
			return entities;
		},
		
		/**
		 * Transform entity
		 * 
		 * @methods
		 *
		 * @param {Object} transaction
		 * 
		 * @return {Object} Transformed transaction
		 */
		transformEntity( transaction )
		{
			if ( !transaction ) {
				return null;
			}
			
			if ( transaction.type === "send" ) {
				delete transaction.involved;
			}
			
			return transaction;
		}
	}
};