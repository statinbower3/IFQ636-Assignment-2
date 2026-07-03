/**
 * @file requestChain.test.js
 * @description UNIT tests for the Chain of Responsibility pattern (RequestChain).
 *
 * The handlers are Express middleware, so the tests use lightweight fake
 * req/res/next objects (Sinon spies) instead of a running server. They verify
 * that each handler does its job and either delegates to the next link or
 * short-circuits the chain, and that buildChain() wires handlers in order.
 */

const { expect } = require('chai');
const sinon = require('sinon');

const {
  RequestHandler,
  LoggingHandler,
  SanitizationHandler,
  ValidationHandler,
  buildChain,
} = require('../../patterns/chain/RequestChain');

// Helpers to build fake Express objects.
const fakeReq = (over = {}) => ({ method: 'POST', originalUrl: '/api/test', ip: '127.0.0.1', body: {}, ...over });
const fakeRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res); // allow res.status(400).json(...)
  res.json   = sinon.stub().returns(res);
  return res;
};

describe('UNIT: LoggingHandler', () => {
  it('always passes the request to next() when it is the last handler', async () => {
    const next = sinon.spy();
    await new LoggingHandler().handle(fakeReq(), fakeRes(), next);
    expect(next.calledOnce).to.equal(true);
  });
});

describe('UNIT: SanitizationHandler', () => {
  it('trims leading/trailing whitespace from string body fields', async () => {
    const req = fakeReq({ body: { name: '  Ada  ', email: ' ada@x.com ' } });
    const next = sinon.spy();
    await new SanitizationHandler().handle(req, fakeRes(), next);
    expect(req.body.name).to.equal('Ada');
    expect(req.body.email).to.equal('ada@x.com');
    expect(next.calledOnce).to.equal(true);
  });

  it('leaves non-string body fields untouched', async () => {
    const req = fakeReq({ body: { capacity: 25, active: true } });
    await new SanitizationHandler().handle(req, fakeRes(), sinon.spy());
    expect(req.body.capacity).to.equal(25);
    expect(req.body.active).to.equal(true);
  });
});

describe('UNIT: ValidationHandler', () => {

  it('short-circuits with 400 when a required field is missing', async () => {
    const handler = new ValidationHandler(['title', 'capacity']);
    const req  = fakeReq({ body: { title: 'X' } }); // capacity missing
    const res  = fakeRes();
    const next = sinon.spy();

    await handler.handle(req, res, next);

    expect(res.status.calledWith(400)).to.equal(true);
    expect(res.json.calledOnce).to.equal(true);
    expect(res.json.firstCall.args[0].message).to.match(/capacity/);
    expect(next.called).to.equal(false); // chain stopped
  });

  it('passes through when all required fields are present', async () => {
    const handler = new ValidationHandler(['title', 'capacity']);
    const req  = fakeReq({ body: { title: 'X', capacity: 10 } });
    const res  = fakeRes();
    const next = sinon.spy();

    await handler.handle(req, res, next);

    expect(res.status.called).to.equal(false);
    expect(next.calledOnce).to.equal(true);
  });

  it('skips validation for GET requests (no body expected)', async () => {
    const handler = new ValidationHandler(['title']);
    const req  = fakeReq({ method: 'GET', body: {} });
    const next = sinon.spy();
    await handler.handle(req, fakeRes(), next);
    expect(next.calledOnce).to.equal(true);
  });
});

describe('UNIT: buildChain()', () => {

  it('throws when given an empty handler list', () => {
    expect(() => buildChain([])).to.throw(/at least one handler/);
  });

  it('links handlers so the request flows through every link to next()', async () => {
    const req  = fakeReq({ body: { title: '  X  ', capacity: 10 } });
    const res  = fakeRes();
    const next = sinon.spy();

    const middleware = buildChain([
      new LoggingHandler(),
      new SanitizationHandler(),
      new ValidationHandler(['title', 'capacity']),
    ]);

    await middleware(req, res, next);

    expect(req.body.title).to.equal('X'); // sanitiser ran
    expect(next.calledOnce).to.equal(true); // validator passed → chain completed
  });

  it('short-circuits the whole chain when validation fails mid-way', async () => {
    const req  = fakeReq({ body: { title: '  X  ' } }); // capacity missing
    const res  = fakeRes();
    const next = sinon.spy();

    const middleware = buildChain([
      new SanitizationHandler(),
      new ValidationHandler(['title', 'capacity']),
    ]);

    await middleware(req, res, next);

    expect(res.status.calledWith(400)).to.equal(true);
    expect(next.called).to.equal(false);
  });
});
