import React from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/football/ui'

/** Temporary page for shell routes that are not built yet. */
const ComingSoon = ({ title }) => (
    <div className="flex flex-col gap-6">
        <h1 className="font-display text-4xl font-bold text-white">{title}</h1>
        <EmptyState title="This page is being built next">
            Meanwhile, browse{' '}
            <Link to="/fixtures" className="font-semibold text-fi-link">
                fixtures and results
            </Link>
            .
        </EmptyState>
    </div>
)

export default ComingSoon
