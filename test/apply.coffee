
util = require('util')
assert = require('assert')

class MyClass
	constructor: (@first, @second, @rest...) ->
		@constructorCallCount = if @constructorCallCount?  then 1 else @constructorCallCount + 1
		@allArgs = Array.prototype.slice.call(arguments)

	someInstanceMethod: () -> "I am the instance method"

class MySubclass extends MyClass
	constructor: () ->
		MyClass.apply(this, arguments)
		@constructorCallCount += 1

	someInstanceMethod: () -> "I am the overridden instance method, but also: #{super()}"

describe 'apply on a class', ->
	describe 'with args[1,2]', ->
		args = [1, 2]
		theInstance = new MyClass()
		MyClass.apply(theInstance, args)

		it 'should have non-null args propery', -> assert theInstance.allArgs
		it 'should have a args.length of 2', -> assert.equal theInstance.allArgs.length, 2
		it 'should have a first of value 1', -> assert.equal theInstance.first, 1
		it 'should have a second of value 2', -> assert.equal theInstance.second, 2
		it 'should have splatArgs of [1,2]', -> assert.deepEqual theInstance.allArgs, [1,2]
		it 'should allow calling inherited methods', -> assert.equal theInstance.someInstanceMethod(), "I am the instance method"
		it 'should have called the constructor once', -> assert.equal theInstance.constructorCallCount, 1

	describe '(derived) with args[1,2]', ->
		args = [1, 2]
		theInstance = new MySubclass()
		MySubclass.apply(theInstance, args)

		it 'should have non-null args propery', -> assert theInstance.allArgs
		it 'should have a args.length of 2', -> assert.equal theInstance.allArgs.length, 2
		it 'should have a first of value 1', -> assert.equal theInstance.first, 1
		it 'should have a second of value 2', -> assert.equal theInstance.second, 2
		it 'should have splatArgs of [1,2]', -> assert.deepEqual theInstance.allArgs, [1,2]
		it 'should allow calling inherited methods', ->
			expectedMessage = "I am the overridden instance method, but also: I am the instance method"
			assert.equal theInstance.someInstanceMethod(), expectedMessage

	# describe 'with args[abc, def]', ->
	# 	args = ['abc', 'def']
	# 	theInstance = new MyClass()
	# 	MyClass.apply(theInstance, args)
	# 	shouldHaveTheRightValues(theInstance, 'abc', 'def', ['abc', 'def'])

