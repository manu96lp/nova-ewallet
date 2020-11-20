"use strict";

const { generateRandomKey } = require( "../helpers/common" );

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
		fields: [ "rechargeCode", "balance", "cvu", "currency" ],
		
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
				const item = await this.findByOwner( user );
				
				if ( item ) {
					throw new MoleculerClientError( "User already has an account", 422, "", [ { field: "user", message: "already exists" } ] );
				}
				
				const entity = {
					user: ctx.params.user,
					currency: ctx.params.currency
				};
				
				await this.validateEntity( entity );
				
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
				date: { type: "date" },
				
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
				
				const account = await this.adapter.findOne( { rechargeCode: code } );
				
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
				
				entity.account 		= account;
				entity.involved 	= store;
				entity.amount 		= amount;
				entity.type 		= "recharge";
				entity.currency 	= account.currency;
				entity.data 		= address;
				entity.createdAt 	= date;
				
				const transaction = await ctx.call( "transactions.create", entity );
				const updateData = { "$set": { balance: ( account.balance + amount ) } };
				
				await this.adapter.updateById( account._id, updateData );
				
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
				
				const senderAccount = await this.adapter.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !senderAccount ) {
					throw new MoleculerClientError( "Sender account not found", 404 );
				}
				
				if ( amount > senderAccount.amount ) {
					throw new MoleculerClientError( "Insufficient funds", 422, "", [ { field: "amount", message: "lesser than transfer amount" } ] );
				}
				
				const receiver = await ctx.call( "users.find", { fields: [ "_id", "status" ], query: { email } } );
				
				if ( !receiver ) {
					throw new MoleculerClientError( "Email not found", 422, "", [ { field: "email", message: "not found" } ] );
				}
				
				const validStatuses = [ "protected", "authorized" ];
				
				if ( !validStatuses.includes( receiver.status ) ) {
					throw new MoleculerClientError( "Receiver cannot accept transferences", 409 );
				}
				
				const receiverAccount = await this.adapter.findOne( { user: receiver._id.toString( ) } );
				
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
				
				entity.account 		= senderAccount;
				entity.involved 	= receiverAccount.code;
				entity.amount 		= ( amount * -1.0 );
				entity.data 		= { name: receiverAccount.name, email: receiverAccount.email };
				
				const transaction = await ctx.call( "transactions.create", entity );
				
				await this.adapter.updateById( senderAccount._id,  { "$set": { balance: ( senderAccount.balance - amount ) } } );
				
				entity.account 		= receiverAccount;
				entity.involved 	= senderAccount.code;
				entity.amount 		= amount;
				entity.data 		= { name: senderAccount.name, email: senderAccount.email };
				
				await ctx.call( "transactions.create", entity );
				await this.adapter.updateById( receiverAccount._id, { "$set": { balance: ( receiverAccount.balance + amount ) } } );
				
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
				keys: [ "#userID", "limit", "offset" ]
			},
			params: {
				limit: { type: "number", min: 5, max: 50, default: 15, optional: true, convert: true },
				offset: { type: "number", min: 0, default: 0, optional: true, convert: true },
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
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
		 * @param {String} type - Type [ incoming, outgoing, any ]
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
				keys: [ "#userID", "type", "frequence", "limit" ]
			},
			params: {
				type: { type: "enum", values: [ "incoming", "outgoing", "any" ] },
				frequence: { type: "enum", values: [ "day", "week", "month" ] },
				limit: { type: "number", min: 1, max: 60, optional: true }
			},
			
			async handler( ctx )
			{
				const account = await this.findByOwner( ctx.meta.user._id.toString( ) );
				
				if ( !account ) {
					throw new MoleculerClientError( "Account not found", 422, "", [ { field: "user", message: "not found" } ] );
				}
				
				const defaultLimits = { day: 30, week: 12, month: 6 };
				const frequenceDays = { day: 1, week: 7, month: 30 };
				
				const type = ctx.params.type;
				const frequence = ctx.params.frequence;
				const limit = ctx.params.limit ? Math.min( ctx.params.limit, ( defaultLimits[ frequence ] * 2 ) ) : defaultLimits[ frequence ];
				
				const startDate = new Date( );
				const endDate = new Date( );
				
				startDate.setDate( startDate.getDate( ) - ( frequenceDays[ frequence ] * limit ) );
				
				const list = await ctx.call( "transactions.period", { account: account._id.toString( ), startDate, endDate } );
				const stats = [ ];
				
				for ( let i = 0 ; i < limit ; i++ )
				{
					stats[ i ] = {
						incoming: { amount: 0.0, count: 0 },
						outgoing: { amount: 0.0, count: 0 }
					};
				}
				
				let pos;
				let days;
				let prop;
				let status = ( type !== "incoming" ) ? ( type !== "any" ) ? -1 : 0 : 1;
				
				for ( let i = 0 ; i < list.rows.length ; i++ )
				{
					if ( status && ( ( status < 0 ) !== ( list.rows[ i ].amount < 0.0 ) ) ) {
						continue;
					}
					
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
		get: {
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
				
				const json = await this.transformDocuments( account );
				
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
				
				const updateData = {
					"$set": { cvu }
				};
				
				await this.adapter.updateById( account._id.toString( ), updateData );
			}
		},
		
		
		/**
		 * Change non-redefined moleculer-db actions visibility to "public" in order to protect them from unauthorized access
		 */
		update: { visibility: "public" },
		list: { visibility: "public" },
		remove: { visibility: "public" }
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