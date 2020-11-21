"use strict";

const { generateRandomKey, verifyAddress } = require( "../helpers/common" );

const DbService = require( "../mixins/db.mixin" );
const CacheCleanerMixin = require( "../mixins/cache.cleaner.mixin" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "accounts",
	
	mixins: [
		DbService( "accounts" ),
		CacheCleanerMixin( [
			"cache.clean.users",
			"cache.clean.accounts",
			"cache.clean.transactions"
		] )
	],
	
	settings: {
		fields: [ "rechargeCode", "balance", "cvu", "currency", "updatedAt" ],
		
		entityValidator: {
			user: { type: "string" },
			
			code: { type: "string" },
			rechargeCode: { type: "string" },
			balance: { type: "number", default: 0.0 },
			cvu: { type: "string", optional: true },
			currency: { type: "enum", values: [ "ARS", "USD" ], default: "ARS" },
			
			createdAt: { type: "date", default: ( ) => new Date( ) },
			updatedAt: { type: "date", default: ( ) => new Date( ) }
		}
	},
	
	actions: {
		/**
		 * Change moleculer-db actions visibility to "public" in order to protect them from unauthorized access
		 */
		get: { visibility: "public" },
		find: { visibility: "public" },
		count: { visibility: "public" },
		list: { visibility: "public" },
		create: { visibility: "public" },
		insert: { visibility: "public" },
		update: { visibility: "public" },
		remove: { visibility: "public" },
		
		/**
		 * Create a new account
		 *
		 * @actions
		 * 
		 * @param {String} user - Account owner (user id)
		 * @param {String} currency - Account currency
		 *
		 * @returns {Object} Created account
		 */
		create: {
			visibility: "public",
			params: {
				user: { type: "string" },
				currency: { type: "string", optional: true }
			},
			
			async handler( ctx )
			{
				const item = await this.findByOwner( ctx.params.user );
				
				if ( item ) {
					throw new MoleculerClientError( "User already has an account", 422, "", [ { field: "user", message: "already exists" } ] );
				}
				
				const entity = {
					user: ctx.params.user,
					currency: ctx.params.currency
				};
				
				do
				{
					entity.code = generateRandomKey( 10, "alphanumeric" );
				}
				while ( await this.findByCode( entity.code ) )
				
				do
				{
					entity.rechargeCode = generateRandomKey( 10, "numeric" );
				}
				while ( await this.findByRechargeCode( entity.rechargeCode ) )
				
				await this.validateEntity( entity );
				
				const result = await this.adapter.insert( entity );
				const json = await this.transformDocuments( ctx, { }, result );
				
				await this.entityChanged( "created", json, ctx );
				
				return json;
			}
		},
		
		/**
		 * Recharge money
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String} code - Client recharge code
		 * @param {String} store - Store name
		 * @param {Number} amount - Recharge amount
		 * @param {Object} address - Store address
		 * @param {Date} date - Recharge date
		 * 
		 * @returns {Object} Created transaction
		 */
		recharge: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "POST /recharge",
			visibility: "published",
			params: {
				code: { type: "string" },
				store: { type: "string" },
				amount: { type: "number", convert: true },
				date: { type: "date", convert: true },
				
				address: { type: "object", props: {
					province: { type: "string" },
					department: { type: "string" },
					locality: { type: "string" },
					street: { type: "string" },
					number: { type: "number", positive: true, convert: true }
				} }
			},
			
			async handler( ctx )
			{
				const { code, store, amount, date, address } = ctx.params;
				
				const account = await this.findByRechargeCode( code );
				
				if ( !account ) {
					throw new MoleculerClientError( "Recharge code not found", 422, "", [ { field: "code", message: "not found" } ] );
				}
				
				if ( address ) {
					const isValid = await verifyAddress( address );
					
					if ( !isValid ) {
						throw new MoleculerClientError( "Invalid address", 422, "", [ { field: "address", message: "invalid" } ] );
					}
				}
				
				const entity = { };
				const update = {
					balance: ( account.balance + amount ),
					updatedAt: new Date( )
				};
				
				entity.account 		= account._id.toString( );
				entity.involved 	= store;
				entity.amount 		= amount;
				entity.type 		= "recharge";
				entity.currency 	= account.currency;
				entity.data 		= { address };
				entity.createdAt 	= date;
				
				const transaction = await ctx.call( "transactions.create", entity );
				
				await this.adapter.updateById( account._id, { "$set": update } );
				
				return transaction;
			}
		},
		
		/**
		 * Transfer money
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String} email - Receiver user email
		 * @param {Number} amount - Cash amount
		 * 
		 * @returns {Object} Created transaction
		 */
		transfer: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "POST /transfer",
			visibility: "published",
			params: {
				email: { type: "email" },
				amount: { type: "number", min: 1.0, positive: true, convert: true }
			},
			
			async handler( ctx )
			{
				const { email, amount } = ctx.params;
				
				const senderAccount = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !senderAccount ) {
					throw new MoleculerClientError( "Sender account not found", 404 );
				}
				
				if ( amount > senderAccount.balance ) {
					throw new MoleculerClientError( "Insufficient funds", 409 );
				}
				
				const receiver = await ctx.call( "users.findByEmail", { email, fields: [ "_id", "status", "name", "surname" ] } );
				
				if ( !receiver ) {
					throw new MoleculerClientError( "Email not found", 422, "", [ { field: "email", message: "not found" } ] );
				}
				
				const validStatuses = [ "protected", "authorized" ];
				
				if ( !validStatuses.includes( receiver.status ) ) {
					throw new MoleculerClientError( "Receiver cannot accept transferences", 409 );
				}
				
				const receiverAccount = await this.findByOwner( receiver._id.toString( ) );
				
				if ( !receiverAccount ) {
					throw new MoleculerClientError( "Receiver account not found", 404 );
				}
				
				if ( senderAccount._id.toString( ) === receiverAccount._id.toString( ) ) {
					throw new MoleculerClientError( "Accounts cannot be the same", 409 );
				}
				
				if ( senderAccount.currency !== receiverAccount.currency ) {
					throw new MoleculerClientError( "Accounts do not share the same currency type", 409 );
				}
				
				const entity = {
					type: "send",
					currency: senderAccount.currency
				};
				
				const update = {
					balance: ( senderAccount.balance - amount ),
					updatedAt: new Date( )
				};
				
				entity.account 		= senderAccount._id.toString( );
				entity.involved 	= receiverAccount.code;
				entity.amount 		= ( amount * -1.0 );
				entity.data 		= { name: receiver.name, surname: receiver.surname, email };
				
				const transaction = await ctx.call( "transactions.create", entity );
				
				await this.adapter.updateById( senderAccount._id, { "$set": update } );
				
				entity.account 		= receiverAccount._id.toString( );
				entity.involved 	= senderAccount.code;
				entity.amount 		= amount;
				entity.data 		= { name: ctx.meta.user.name, email: ctx.meta.user.email };
				
				update.balance 		= ( receiverAccount.balance + amount );
				
				await ctx.call( "transactions.create", entity );
				await this.adapter.updateById( receiverAccount._id, { "$set": update } );
				
				delete transaction.involved;
				
				return transaction;
			}
		},
		
		/**
		 * Get transactions
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 * 
		 * @returns {Object} Created transaction
		 */
		transactions: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "GET /transactions",
			visibility: "published",
			cache: {
				keys: [ "#userID", "limit", "offset" ],
				ttl: 300
			},
			params: {
				limit: { type: "number", min: 5, max: 50, optional: true, convert: true },
				offset: { type: "number", min: 0, optional: true, convert: true },
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
				const limit = ctx.params.limit || 15;
				const offset = ctx.params.offset || 0;
				
				const list = await ctx.call( "transactions.list", { account: account._id.toString( ), limit, offset } );
				
				return list;
			}
		},
		
		/**
		 * Get statistics
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String} frequence - Frequence [ day, week, month ]
		 * @param {Number?} limit - Period limit
		 *
		 * @returns {Object} Statistics
		 */
		statistics: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "GET /statistics",
			visibility: "published",
			cache: {
				keys: [ "#userID", "frequence", "limit" ],
				ttl: 300
			},
			params: {
				frequence: { type: "enum", values: [ "day", "week", "month" ] },
				limit: { type: "number", min: 1, max: 60, optional: true, convert: true }
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
				const defaultLimits = { day: 30, week: 12, month: 6 };
				const frequenceDays = { day: 1, week: 7, month: 30 };
				
				const frequence = ctx.params.frequence;
				const limit = ctx.params.limit ? Math.min( ctx.params.limit, ( defaultLimits[ frequence ] * 2 ) ) : defaultLimits[ frequence ];
				
				const timestamp = Date.now( );
				
				const startDate = new Date( timestamp - ( ( frequenceDays[ frequence ] * limit ) * 86400000 ) );
				const endDate = new Date( timestamp + ( 900000 - ( timestamp % 900000 ) ) );
				
				startDate.setHours( 0, 0, 0, 0 );
				
				const list = await ctx.call( "transactions.period", { account: account._id.toString( ), startDate: startDate.toString( ), endDate: endDate.toString( ) } );
				const stats = [ ];
				
				for ( let i = 0 ; i < limit ; i++ )
				{
					stats[ i ] = {
						date: new Date( startDate.getTime( ) + ( ( frequenceDays[ frequence ] * i ) * 86400000 ) ),
						
						incoming: { amount: 0.0, count: 0 },
						outgoing: { amount: 0.0, count: 0 }
					};
				}
				
				let pos;
				let days;
				let prop;
				
				for ( let i = 0 ; i < list.count ; i++ )
				{
					days = ( ( list.rows[ i ].createdAt.getTime( ) - startDate.getTime( ) ) / 86400000 ) | 0;
					pos = Math.min( ( days / frequenceDays[ frequence ] ) | 0, ( limit - 1 ) );
					
					prop = ( list.rows[ i ].amount < 0.0 ) ? stats[ pos ].outgoing : stats[ pos ].incoming;
					
					prop.count++;
					prop.amount += list.rows[ i ].amount;
				}
				
				return {
					rows: stats,
					count: list.count
				};
			}
		},
		
		/**
		 * Get current account
		 * Auth is required
		 *
		 * @actions
		 *
		 * @returns {Object} Account
		 */
		current: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "GET /current",
			visibility: "published",
			cache: {
				keys: [ "#userID" ]
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
				const json = await this.transformDocuments( ctx, { }, account );
				
				return json;
			}
		},
		
		/**
		 * Associate a CVU
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String?} cvu
		 */
		associateCVU: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "POST /cvu",
			visibility: "published",
			params: {
				cvu: { type: "string", length: 22, numeric: true, optional: true }
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
				if ( account.cvu ) {
					throw new MoleculerClientError( "Account already has an associated CVU ", 422, "", [ { field: "cvu", message: "already associated" } ] );
				}
				
				const cvu = ctx.params.cvu || generateRandomKey( 22, "numeric" );
				
				const update = {
					cvu,
					updatedAt: new Date( )
				};
				
				await this.adapter.updateById( account._id.toString( ), { "$set": update } );
			}
		}
	},
	
	methods: {
		/**
		 * Find an account by owner's user id
		 * 
		 * @methods
		 * 
		 * @param {String} user
		 * 
		 * @return {Object} Account
		 */
		findByOwner( user ) {
			if ( !user ) {
				return null;
			}
			
			return this.adapter.findOne( { user } );
		},
		
		/**
		 * Find an account by code
		 * 
		 * @methods
		 * 
		 * @param {String} code
		 * 
		 * @return {Object} Account
		 */
		findByCode( code ) {
			if ( !code ) {
				return null;
			}
			
			return this.adapter.findOne( { code } );
		},
		
		/**
		 * Find an account by recharge code
		 * 
		 * @methods
		 * 
		 * @param {String} rechargeCode
		 * 
		 * @return {Object} Account
		 */
		findByRechargeCode( rechargeCode ) {
			if ( !rechargeCode ) {
				return null;
			}
			
			return this.adapter.findOne( { rechargeCode } );
		}
	}
};