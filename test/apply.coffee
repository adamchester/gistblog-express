
util = require('util')
assert = require('assert')

class MyClass
	constructor: (@first, @second, @additional...) ->
		@allArgs = Array.prototype.slice.call(arguments)

		shouldHaveTheRightValues = (instance, len, firstVal, secondVal, deepEqual) -> [
			it 'should have non-null args propery', -> assert instance.allArgs
			it 'should have a args.length of 2', -> assert.equal instance.allArgs.length, len
			it 'should have a first of value 1', -> assert.equal instance.first, firstVal
			it 'should have a second of value 2', -> assert.equal instance.second, secondVal
			it 'should have splatArgs of [1,2]', -> assert.deepEqual instance.allArgs, deepEqual
		]

		describe 'apply on a class', ->
			describe 'with args[1,2]', ->
				args = [1, 2]
				theInstance = new MyClass()
				MyClass.apply(theInstance, args)

				shouldHaveTheRightValues(theInstance, 2, 1, 2, [1, 2])

			describe 'with args[abc, def, ghi]', ->
				args = ['abc', 'def', 'ghi']
				theInstance = new MyClass()
				MyClass.apply(theInstance, args)

				it 'should do something', -> assert true
				it 'should do something else', -> assert true

