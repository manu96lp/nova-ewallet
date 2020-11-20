const fs = require( "fs" );
const path = require( "path" );

function buildTemplate( template, input )
{
	const fileName = `${ template }.html`;
	const filePath = path.join( __dirname, "templates", fileName );
	
	try
	{
		const content = fs.readFileSync( filePath, "utf8" );
		
		const keys = Object.keys( input ).reduce( ( acc, value ) => {
			acc[ `{{${ value }}}` ] = input[ value ];
			
			return acc;
		}, { } );
		
		const regex = new RegExp( Object.keys( keys ).join( "|" ), "gi" );
		const result = content.replace( regex, ( matched ) => keys[ matched ] );
		
		return result;
	}
	catch( error ) {
		console.log( error );
	}
	
	return null;
}

module.exports = buildTemplate;