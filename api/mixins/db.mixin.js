"use strict";

require( "dotenv" ).config( );

const DbService = require( "moleculer-db" );

module.exports = function( collection ) {
	if ( !process.env.MONGO_URI ) {
		throw new Error( "Missing MongoDB connection parameters" );
	}
	
	const MongoAdapter = require( "moleculer-db-adapter-mongo" );
	
	const schema = {
		mixins: [ DbService ],
		adapter: new MongoAdapter( process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true } ),
		collection,

		async started( ) {
			if ( this.seedDB ) {
				const count = await this.adapter.count( );
				
				if ( count == 0 ) {
					await this.seedDB( );
				}
			}
		}
	};
	
	return schema;
};