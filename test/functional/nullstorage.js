'use strict';

require('./lib/startup');

let assert = require('assert');
let crypto = require('crypto');

function readfile(x) {
  return require('fs').readFileSync(__dirname + '/' + x);
}

module.exports = function() {
  let server = process.server;
  let server2 = process.server2;

  it('trying to fetch non-existent package / null storage', function() {
    return server.getPackage('test-nullstorage-nonexist')
             .status(404)
             .body_error(/no such package/);
  });

  describe('test-nullstorage on server2', function() {
    before(function() {
      return server2.addPackage('test-nullstorage2');
    });

    it('creating new package - server2', function() {/* test for before() */});

    it('downloading non-existent tarball', function() {
      return server.getTarball('test-nullstorage2', 'blahblah')
               .status(404)
               .body_error(/no such file/);
    });

    describe('tarball', function() {
      before(function() {
        return server2.putTarball('test-nullstorage2', 'blahblah', readfile('fixtures/binary'))
                 .status(201)
                 .body_ok(/.*/);
      });

      before(function() {
        let pkg = require('./lib/package')('test-nullstorage2');
        pkg.dist.shasum = crypto.createHash('sha1').update(readfile('fixtures/binary')).digest('hex');
        return server2.putVersion('test-nullstorage2', '0.0.1', pkg)
                 .status(201)
                 .body_ok(/published/);
      });

      it('uploading new tarball', function() {/* test for before() */});

      it('downloading newly created tarball', function() {
        return server.getTarball('test-nullstorage2', 'blahblah')
                 .status(200)
                 .then(function(body) {
                   assert.deepEqual(body, readfile('fixtures/binary'));
                 });
      });

      it('downloading newly created package', function() {
        return server.getPackage('test-nullstorage2')
                 .status(200)
                 .then(function(body) {
                   assert.equal(body.name, 'test-nullstorage2');
                   assert.equal(body.versions['0.0.1'].name, 'test-nullstorage2');
                   assert.equal(body.versions['0.0.1'].dist.tarball, 'http://localhost:55551/test-nullstorage2/-/blahblah');
                   assert.deepEqual(body['dist-tags'], {latest: '0.0.1'});
                 });
      });
    });
  });
};

