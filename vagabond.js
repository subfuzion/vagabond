( function () {
                   require( 'sn-core' );
  var path       = require( 'path' );
  var fs         = require( 'fs' );
  var crypto     = require( 'crypto' );
  var Handlebars = require( 'handlebars' );
  var exec       = require( 'child_process' ).exec;

  var config_file_template;
  var vagabond_defaults = {
    hostname: "helium",
    addr: "192.168.1.2",
    ova: "http://sm5.us/larb/Larb v2.02 Debian 7.3.0 i386.ova",
    _configFileName: "vagabond.json"
  };
  _$construct( 'exports', vagabond_defaults, module );

  module.exports.prototype.init = function ( callback ) {
    var defaults = {};
    if( ( 'win32' !== process.platform ) && ( process.env.USER ) ) {
      defaults.user = { name: process.env.USER };
      try {
        defaults.user.ssh =
          fs.readFileSync( [ process.env.HOME, '.ssh', 'id_rsa.pub' ].join( path.sep ) ).toString()
          .replace( new RegExp( '\n', 'g' ), '' );
      } catch ( err ) {
        // Silently Fail. Don't do anything here
      }
    };
    defaults._$shallow( vagabond_defaults );
    delete defaults._configFileName;
    defaults.name = crypto.randomBytes( 8 ).toString( 'hex' ) + '_' + defaults.hostname;
    fs.writeFileSync( "vagabond.json", this.configFileCreate( defaults ) );
    this._$shallow( defaults );
    callback._$nextTick();
  };

  module.exports.prototype.configFileCreate = function( defaults ) {
    if( ! config_file_template ) {
      config_file_template = _template( 
        fs.readFileSync( [ __dirname, 'templates', this._configFileName ].join( path.sep ) ).toString(),
        defaults );
    }
    return config_file_template;
  };

  module.exports.prototype.create = function ( callback ) {
    var appliancePath = _getAppliancePath( this.ova );
    var cmd = [ 'VBoxManage', 'import', appliancePath, '--vsys', '0', '--vmname', this.name, '--eula', 'accept' ].join(' ');
    exec( cmd, function( err, stdout, stderr ) {
      if( err ) {
        console.log( "Error: " + err.toString() );
        process.exit( 3 );
      }
      cmd = [ 'VBoxManage guestproperty set', this.name, '/smithee.us/vagabond/hostname', this.hostname ].join( ' ' );
      exec( cmd, function( err, stdout, stderr ) {
        if( err ) {
          console.log( "Error: " + err.toString() );
          process.exit( 4 );
        }
        cmd = [ 'VBoxManage guestproperty set', this.name, '/smithee.us/vagabond/ip', this.addr ].join( ' ' );
        exec( cmd, function( err, stdout, stderr ) {
          if( err ) {
            console.log( "Error: " + err.toString() );
            process.exit( 5 );
          }
          callback._$nextTick();
        }.bind( this ) );
      }.bind( this ) );
    }.bind(this) );
  };

  module.exports.prototype.launch = function ( callback ) {
    var cmd = [ 'VBoxManage', 'startvm', this.name, '--type', 'headless' ].join( ' ' );
    exec( cmd, function( err, stdout, stderr ) {
      if( err ) {
        console.log( "Error: " + err.toString() );
        process.exit( 6 );
      }
      callback._$nextTick();
    } );
  };

  module.exports.prototype.shutdown = function ( callback ) {
    var cmd = [ 'VBoxManage', 'controlvm', this.name, 'acpipowerbutton' ].join( ' ' );
    exec( cmd, function( err, stdout, stderr ) {
      if( err ) {
        console.log( "Error: " + err.toString() );
        process.exit( 8 );
      }
      callback._$nextTick();
    } );
  };;  

  module.exports.prototype.destroy = function ( callback ) {
    var cmd = [ 'VBoxManage', 'unregistervm', this.name, '--delete' ].join( ' ' );
    exec( cmd, function( err, stdout, stderr ) {
      if( err ) {
        console.log( "Error: " + err.toString() );
        process.exit( 9 );
      }
      callback._$nextTick();
    } )
  };

  module.exports.prototype.ip = function ( callback ) {
    console.log( this.addr );
    callback._$nextTick();
  };

  function _template( source, params ) {
    return Handlebars.compile( source ) ( params );
  }

  function _getAppliancePath ( url ) {
    return [ process.env.HOME, '.vagabond', url.split('/').slice(-1)[0] ].join( path.sep ).replace( new RegExp(' ', 'g'), '\\ ' );
  }
} ) ();