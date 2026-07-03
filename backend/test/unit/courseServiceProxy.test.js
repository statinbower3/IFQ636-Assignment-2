/**
 * @file courseServiceProxy.test.js
 * @description UNIT tests for the Proxy pattern (CourseServiceProxy).
 *
 * The proxy adds two cross-cutting concerns over the real CourseService:
 *   1. Role-based access control (admin-only mutations → 403 otherwise).
 *   2. 404 handling when a course is not found.
 *
 * To isolate the proxy from MongoDB, the private `_realService` on the exported
 * proxy instance is replaced with a stub object. The tests then verify the proxy
 * enforces its guards and delegates to the real service only when allowed.
 */

const { expect } = require('chai');
const sinon = require('sinon');

const proxy = require('../../patterns/proxy/CourseServiceProxy');

const ADMIN   = { name: 'Root',  role: 'admin' };
const STUDENT = { name: 'Ada',   role: 'student' };

// Replace the proxied real service with a fully stubbed double.
let realStub;
beforeEach(() => {
  realStub = {
    create:   sinon.stub().resolves({ _id: 'c1', title: 'Cloud 101' }),
    findAll:  sinon.stub().resolves([{ _id: 'c1' }, { _id: 'c2' }]),
    findById: sinon.stub().resolves({ _id: 'c1', title: 'Cloud 101' }),
    update:   sinon.stub().resolves({ _id: 'c1', capacity: 50 }),
    delete:   sinon.stub().resolves({ _id: 'c1' }),
  };
  proxy._realService = realStub;
});

const expectStatus = async (promise, code) => {
  try {
    await promise;
    expect.fail(`expected an error with statusCode ${code}`);
  } catch (err) {
    expect(err.statusCode).to.equal(code);
    return err;
  }
};

describe('UNIT: CourseServiceProxy — create (admin-only)', () => {

  it('delegates to the real service when the user is an admin', async () => {
    const result = await proxy.create({ title: 'Cloud 101' }, ADMIN);
    expect(result.title).to.equal('Cloud 101');
    expect(realStub.create.calledOnce).to.equal(true);
  });

  it('throws 403 and never touches the service when the user is a student', async () => {
    await expectStatus(proxy.create({ title: 'X' }, STUDENT), 403);
    expect(realStub.create.called).to.equal(false);
  });

  it('throws 403 when no user is supplied (guest)', async () => {
    await expectStatus(proxy.create({ title: 'X' }, null), 403);
    expect(realStub.create.called).to.equal(false);
  });
});

describe('UNIT: CourseServiceProxy — read (public)', () => {

  it('findAll returns all courses without requiring a user', async () => {
    const result = await proxy.findAll(null);
    expect(result).to.have.lengthOf(2);
    expect(realStub.findAll.calledOnce).to.equal(true);
  });

  it('findById returns the course when it exists', async () => {
    const result = await proxy.findById('c1', null);
    expect(result._id).to.equal('c1');
  });

  it('findById throws 404 when the course does not exist', async () => {
    realStub.findById.resolves(null);
    await expectStatus(proxy.findById('missing', null), 404);
  });
});

describe('UNIT: CourseServiceProxy — update (admin-only)', () => {

  it('delegates to the real service for an admin', async () => {
    const result = await proxy.update('c1', { capacity: 50 }, ADMIN);
    expect(result.capacity).to.equal(50);
    expect(realStub.update.calledOnceWith('c1', { capacity: 50 })).to.equal(true);
  });

  it('throws 403 for a non-admin', async () => {
    await expectStatus(proxy.update('c1', { capacity: 50 }, STUDENT), 403);
    expect(realStub.update.called).to.equal(false);
  });

  it('throws 404 when the course to update is not found', async () => {
    realStub.update.resolves(null);
    await expectStatus(proxy.update('missing', {}, ADMIN), 404);
  });
});

describe('UNIT: CourseServiceProxy — delete (admin-only)', () => {

  it('delegates to the real service for an admin', async () => {
    const result = await proxy.delete('c1', ADMIN);
    expect(result._id).to.equal('c1');
    expect(realStub.delete.calledOnce).to.equal(true);
  });

  it('throws 403 for a non-admin', async () => {
    await expectStatus(proxy.delete('c1', STUDENT), 403);
    expect(realStub.delete.called).to.equal(false);
  });

  it('throws 404 when the course to delete is not found', async () => {
    realStub.delete.resolves(null);
    await expectStatus(proxy.delete('missing', ADMIN), 404);
  });
});
